// Helper function to check if an IP is within the allowed network
export function isIpAllowed(ip:string) {
    ip = ip.split(':').slice(-1)[0];
    const network = process.env.ALLOWED_NETWORK_FOR_INTERNAL_DOOR!;
    const [networkAddress, networkBits] = network.split('/');
    const networkParts = networkAddress.split('.').map(Number);
    const ipParts = ip.split('.').map(Number);
  
    // Compare each part of the IP address and network address
    for (let i = 0; i < 4; i++) {
      if ((ipParts[i] & networkParts[i]) !== networkParts[i]) {
        return false;
      }
    }
  
    return true;
}
  