// privateEndpointWithDns.bicep
param serviceName string
param location string
param serviceId string
param subnetId string
param groupId string
param dnsZoneName string
param regionalFqdn string = ''

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2021-08-01' = {
  name: 'pe-${serviceName}'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${serviceName}Link'
        properties: {
          privateLinkServiceId: serviceId
          groupIds: [groupId]
        }
      }
    ]
  }
}

resource dnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' existing = {
  name: dnsZoneName
}

resource dnsRecord 'Microsoft.Network/privateDnsZones/A@2020-06-01' = {
  name: serviceName
  parent: dnsZone
  properties: {
    ttl: 3600
    aRecords: [
      {
        ipv4Address: privateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]
      }
    ]
  }
}

// Optional Regional DNS Record
resource regionalDnsRecord 'Microsoft.Network/privateDnsZones/A@2020-06-01' = if (regionalFqdn != '') {
  name: regionalFqdn
  parent: dnsZone
  properties: {
    ttl: 3600
    aRecords: [
      {
        ipv4Address: privateEndpoint.properties.customDnsConfigs[1].ipAddresses[0]
      }
    ]
  }
}

output privateIpAddress string = privateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]
