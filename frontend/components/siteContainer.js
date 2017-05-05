import React from 'react';
import { Link } from 'react-router';

import { replaceHistory } from '../actions/routeActions';
import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';

const propTypes = {
  storeState: React.PropTypes.object,
  params: React.PropTypes.object //{id, branch, splat, fileName}
};

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { storeState } = this.props;
    if (storeState.sites.length) {
      this.downloadCurrentSiteData();
    }
  }

  componentDidUpdate(prevProps) {
    const { storeState } = this.props;
    const prevStoreState = prevProps.storeState;

    if (storeState.sites.length && !prevStoreState.sites.length) {
      this.downloadCurrentSiteData();
    }
  }

  downloadCurrentSiteData() {
    const { storeState, params } = this.props;
    const currentSite = this.getCurrentSite(storeState.sites, params.id);

    if (currentSite) {
      siteActions.fetchBranches(currentSite)
    } else {
      replaceHistory('/sites');
    }
  }

  getPageTitle(pathname) {
    return pathname.split('/').pop();
  }

  getCurrentSite(sites, siteId) {
    return sites.find((site) => {
      // force type coersion
      return site.id == siteId;
    });
  }

  render () {
    const { storeState, children, params, location } = this.props;

    const site = this.getCurrentSite(storeState.sites, params.id)
    const builds = storeState.builds
    const buildLogs = storeState.buildLogs
    const publishedBranches = storeState.publishedBranches.filter(branch => {
      return branch.site.id === site.id
    })
    const publishedFiles = storeState.publishedFiles
    const childConfigs = { site, builds, buildLogs, publishedBranches, publishedFiles }

    const pageTitle = this.getPageTitle(location.pathname);

    if (!site) {
      return null;
    }

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <AlertBanner
            message={storeState.alert.message}
            status={storeState.alert.status}/>
          <PagesHeader
            repository={site.repository}
            owner={site.owner}
            title={pageTitle}
            siteId={site.id}
            branch={params.branch || site.defaultBranch}
            fileName={params.fileName}
            viewLink={site.viewLink}
          />
          <div className="usa-grid">
            {children &&
              React.cloneElement(children, childConfigs)
            }
          </div>
        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = propTypes;

export default SiteContainer;
