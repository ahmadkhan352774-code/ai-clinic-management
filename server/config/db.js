const mongoose = require('mongoose');
const dns = require('node:dns');
const dnsPromises = require('node:dns').promises;

dns.setDefaultResultOrder('ipv4first');

const maskMongoUri = (uri) => uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i, '$1<redacted>$3');

const configureDnsServers = () => {
  const configuredServers = (process.env.MONGO_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  const currentServers = dns.getServers();
  const isUsingLocalStub = currentServers.some((server) => server === '127.0.0.1' || server === '::1');

  if (configuredServers.length) {
    dns.setServers(configuredServers);
    console.log(`MongoDB DNS servers set from MONGO_DNS_SERVERS: ${configuredServers.join(', ')}`);
    return;
  }

  if (isUsingLocalStub) {
    const fallbackServers = ['1.1.1.1', '8.8.8.8'];
    dns.setServers(fallbackServers);
    console.log(`MongoDB DNS local resolver detected; using fallback DNS servers: ${fallbackServers.join(', ')}`);
  }
};

const getMongoHost = (uri) => {
  const withoutProtocol = uri.replace(/^mongodb(?:\+srv)?:\/\//i, '');
  const withoutCredentials = withoutProtocol.includes('@') ? withoutProtocol.split('@').slice(1).join('@') : withoutProtocol;
  return withoutCredentials.split('/')[0].split(',')[0].split(':')[0];
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const logDnsDiagnostics = async (uri) => {
  const host = getMongoHost(uri);

  try {
    if (uri.startsWith('mongodb+srv://')) {
      const srvRecords = await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
      const txtRecords = await dnsPromises.resolveTxt(host).catch(() => []);

      console.log(
        `MongoDB DNS SRV resolved for ${host}: ${srvRecords
          .map((record) => `${record.name}:${record.port}`)
          .join(', ')}`
      );

      if (txtRecords.length) {
        console.log(`MongoDB DNS TXT options found for ${host}`);
      }
    } else {
      const lookup = await dnsPromises.lookup(host);
      console.log(`MongoDB DNS lookup resolved for ${host}: ${lookup.address}`);
    }
  } catch (error) {
    console.error(`MongoDB DNS diagnostics failed for ${host}: ${error.message}`);
  }
};

const connectionOptions = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 0,
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 30000,
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 30000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_FREQUENCY_MS) || 10000,
  autoIndex: process.env.NODE_ENV !== 'production',
  tls: true,
  secureProtocol: 'TLSv1_2_method',
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error(`Mongoose connection error: ${error.message}`);
});

const connectDB = async (attempt = 1) => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  const maxAttempts = Number(process.env.MONGO_CONNECT_RETRIES) || 5;
  const retryDelay = Math.min(1000 * 2 ** (attempt - 1), 10000);
  const uri = process.env.MONGO_URI.trim();

  try {
    if (attempt === 1) {
      configureDnsServers();
      console.log(`MongoDB connecting with URI: ${maskMongoUri(uri)}`);
      await logDnsDiagnostics(uri);
    }

    const conn = await mongoose.connect(uri, connectionOptions);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`);

    if (error.reason) {
      console.error(`MongoDB server selection reason: ${error.reason}`);
    }

    if (attempt >= maxAttempts) {
      throw error;
    }

    console.log(`Retrying MongoDB connection in ${retryDelay}ms...`);
    await sleep(retryDelay);
    return connectDB(attempt + 1);
  }
};

module.exports = connectDB;
