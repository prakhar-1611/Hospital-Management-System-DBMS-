// Optional DNS override for networks whose DNS cannot resolve the
// mongodb+srv:// SRV record (error "querySrv ECONNREFUSED" or "ENOTFOUND").
// Set e.g. DNS_SERVERS=8.8.8.8,1.1.1.1 in backend/.env to enable it.
// When DNS_SERVERS is not set, the system DNS is used unchanged.
module.exports = function applyDnsOverride() {
  const list = (process.env.DNS_SERVERS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return;
  require("dns").setServers(list);
  console.log(`Using DNS servers from DNS_SERVERS: ${list.join(", ")}`);
};
