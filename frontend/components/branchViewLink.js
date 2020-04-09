import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getUrlAndViewText = (branchName, viewLink, site) => {
  let url;
  let viewText = 'Preview site';
  if (isDefaultBranch(branchName, site)) {
    viewText = 'View site';
    url = `https://site${site.id}.sites-dev.federalist.18f.gov/site/${site.owner}/${site.repository}/`
  } else if (isDemoBranch(branchName, site)) {
    viewText = 'View demo';
    url = `https://site${site.id}.sites-dev.federalist.18f.gov/demo/${site.owner}/${site.repository}/`
  } else {
    url = `https://site${site.id}.sites-dev.federalist.18f.gov/preview/${site.owner}/${site.repository}/${branchName}/`
  }
  return { url, viewText };
};

export const BranchViewLink = ({
  branchName, viewLink, site, showIcon,
}) => {
  const { url, viewText } = getUrlAndViewText(branchName, viewLink, site);

  if (showIcon) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="view-site-link"
      >
        { viewText }
        <IconView />
      </a>
    );
  }
  return (<a href={url} target="_blank" rel="noopener noreferrer">{ viewText }</a>);
};

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  viewLink: PropTypes.string.isRequired,
  site: SITE.isRequired,
  showIcon: PropTypes.bool,
};

BranchViewLink.defaultProps = {
  showIcon: false,
};

export default connect()(BranchViewLink);
