/** @format */

/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import AfterTheDeadline from './after-the-deadline';
import Card from 'components/card';
import CompactCard from 'components/card/compact';
import DateTimeFormat from '../date-time-format';
import DefaultPostFormat from './default-post-format';
import PublishConfirmation from './publish-confirmation';
import { getSelectedSiteId } from 'state/ui/selectors';
import { isJetpackSite } from 'state/sites/selectors';

const Composing = ( {
	eventTracker,
	fields,
	handleSelect,
	handleToggle,
	isRequestingSettings,
	isSavingSettings,
	onChangeField,
	setFieldValue,
	siteIsJetpack,
	updateFields,
} ) => {
	const CardComponent = siteIsJetpack ? CompactCard : Card;

	return (
		<div>
			<CardComponent className="composing__card site-settings">
				<PublishConfirmation />
				<DefaultPostFormat
					eventTracker={ eventTracker }
					fields={ fields }
					isRequestingSettings={ isRequestingSettings }
					isSavingSettings={ isSavingSettings }
					onChangeField={ onChangeField }
				/>
			</CardComponent>

			{ siteIsJetpack && (
				<AfterTheDeadline
					fields={ fields }
					handleToggle={ handleToggle }
					isRequestingSettings={ isRequestingSettings }
					isSavingSettings={ isSavingSettings }
					setFieldValue={ setFieldValue }
				/>
			) }

			{ ! siteIsJetpack && (
				<DateTimeFormat
					fields={ fields }
					handleSelect={ handleSelect }
					isRequestingSettings={ isRequestingSettings }
					isSavingSettings={ isSavingSettings }
					updateFields={ updateFields }
				/>
			) }
		</div>
	);
};

Composing.defaultProps = {
	fields: {},
	isRequestingSettings: true,
	isSavingSettings: false,
};

Composing.propTypes = {
	eventTracker: PropTypes.func.isRequired,
	fields: PropTypes.object,
	handleSelect: PropTypes.func.isRequired,
	handleToggle: PropTypes.func.isRequired,
	isRequestingSettings: PropTypes.bool,
	isSavingSettings: PropTypes.bool,
	onChangeField: PropTypes.func.isRequired,
	setFieldValue: PropTypes.func.isRequired,
	updateFields: PropTypes.func.isRequired,
};

export default connect( state => ( {
	siteIsJetpack: isJetpackSite( state, getSelectedSiteId( state ) ),
} ) )( Composing );
