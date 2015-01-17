module.exports = function(config) {
  config.cloudflareAccount = {
      email: 'sw@seanw.org',
      token: '61f61455ee6891036f3163a101c9e5847f80eClient'
    };

  config.siteDomain = "seanw.org";

  config.pagesUrl = 'http://seanw.github.com/seanw.org';
  config.ghPages = {remoteUrl: 'https://github.com/seanw/seanw.org/'};
};
