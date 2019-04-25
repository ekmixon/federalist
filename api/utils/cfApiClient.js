const request = require('request');
const url = require('url');
const { filterEntity, firstEntity } = require('./');
const CloudFoundryAuthClient = require('./cfAuthClient');
const config = require('../../config');

class CloudFoundryAPIClient {
  constructor() {
    this.authClient = new CloudFoundryAuthClient();
  }

  createRoute(name) {
    const body = {
      domain_guid: config.env.cfDomainGuid,
      space_guid: config.env.cfSpaceGuid,
      host: name,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/routes',
      token,
      body
    ));
  }

  createS3ServiceInstance(name, serviceName) {
    return this.fetchS3ServicePlanGUID(serviceName)
      .then((servicePlanGuid) => {
        const body = {
          name,
          service_plan_guid: servicePlanGuid,
          space_guid: config.env.cfSpaceGuid,
        };

        return this.accessToken().then(token => this.request(
          'POST',
          '/v2/service_instances?accepts_incomplete=true',
          token,
          body
        ));
      });
  }

  createServiceKey(serviceInstanceName, serviceInstanceGuid, keyIdentifier = 'key') {
    const body = {
      name: `${serviceInstanceName}-${keyIdentifier}`,
      service_instance_guid: serviceInstanceGuid,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/service_keys',
      token,
      body
    ));
  }

  createSiteBucket(name, keyIdentifier = 'key', serviceName = 'basic-public') {
    return this.createS3ServiceInstance(name, serviceName)
      .then(res => this.createServiceKey(name, res.metadata.guid, keyIdentifier));
  }

  createSiteProxyRoute(bucketName) {
    return this.createRoute(bucketName)
      .then(route => this.mapRoute(route.metadata.guid));
  }

  // TODO Check Permissions to Delete Services

  // deleteS3ServiceInstance(name) {
  //   return this.fetchServiceInstances()
  //     .then(res => filterEntity(res, name))
  //     .then(instance => {
  //       return this.accessToken().then(token => this.request(
  //         `DELETE`,
  //         `/v2/service_instances/${instance.metadata.guid}?accepts_incomplete=true`,
  //         token
  //       ));
  //     })
  // }

  // deleteServiceKey(name) {
  //   return this.fetchServiceKeys()
  //     .then(res => filterEntity(res, name))
  //     .then(key => key.entity.service_instance_guid)
  //     .then(guid => {
  //       return this.authClient.accessToken().then(token => this.request(
  //         `DELETE`,
  //         `/v2/service_keys/${guid}`
  //       ));
  //     })
  // }

  fetchServiceInstance(name) {
    return this.fetchServiceInstances()
      .then(res => filterEntity(res, name));
  }

  fetchServiceInstanceCredentials(name) {
    return this.fetchServiceInstance(name)
      .then(instance => this.accessToken().then(token => this.request(
        'GET',
        `/v2/service_instances/${instance.metadata.guid}/service_keys`,
        token
      )))
      .then(keys => firstEntity(keys, `${name} Service Keys`))
      .then(key => key.entity.credentials);
  }

  fetchServiceInstances() {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_instances',
      token
    ));
  }

  fetchServiceKey(name) {
    return this.fetchServiceKeys()
      .then(res => filterEntity(res, name))
      .then(key => this.accessToken().then(token => this.request(
        'GET',
        `/v2/service_keys/${key.metadata.guid}`,
        token
      )));
  }

  fetchServiceKeys() {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_keys',
      token
    ));
  }

  fetchS3ServicePlanGUID(serviceName) {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_plans',
      token
    )).then(res => filterEntity(res, serviceName))
      .then(service => service.metadata.guid);
  }

  mapRoute(routeGuid) {
    const body = {
      app_guid: config.env.cfProxyGuid,
      route_guid: routeGuid,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/route_mappings',
      token,
      body
    ));
  }

  // Private methods
  accessToken() {
    return this.authClient.accessToken();
  }

  request(method, path, accessToken, json) {
    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        url: url.resolve(
          config.env.cfApiHost,
          path
        ),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode > 399) {
          const errorMessage = `Received status code: ${response.statusCode}`;
          reject(new Error(body || errorMessage));
        } else if (typeof body === 'string') {
          resolve(JSON.parse(body));
        } else {
          resolve(body);
        }
      });
    });
  }
}

module.exports = CloudFoundryAPIClient;
