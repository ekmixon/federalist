const { saveSites } = require('../api/services/ProxyDataSync');
const { Site } = require('../api/models');

Site.findAll({
  attributes: ['id', 'owner', 'repository', 'awsBucketName', 'awsBucketRegion', 'subdomain', 'updatedAt', 'config'],
})
  .then(saveSites);
