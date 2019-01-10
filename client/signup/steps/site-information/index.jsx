/** @format */
/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import i18n, { localize } from 'i18n-calypso';
import { each, reduce, trim, size } from 'lodash';

/**
 * Internal dependencies
 */
import StepWrapper from 'signup/step-wrapper';
import SignupActions from 'lib/signup/actions';
import { getSiteInformation } from 'state/signup/steps/site-information/selectors';
import { setSiteInformation } from 'state/signup/steps/site-information/actions';
import { getSiteType } from 'state/signup/steps/site-type/selectors';
import Button from 'components/button';
import FormTextInput from 'components/forms/form-text-input';
import FormLabel from 'components/forms/form-label';
import FormFieldset from 'components/forms/form-fieldset';
import InfoPopover from 'components/info-popover';
import { getSiteTypePropertyValue } from 'lib/signup/site-type';
import { recordTracksEvent } from 'state/analytics/actions';

/**
 * Style dependencies
 */
import './style.scss';

export class SiteInformation extends Component {
	static propTypes = {
		flowName: PropTypes.string,
		goToNextStep: PropTypes.func.isRequired,
		positionInFlow: PropTypes.number.isRequired,
		submitStep: PropTypes.func.isRequired,
		updateStep: PropTypes.func.isRequired,
		signupProgress: PropTypes.array,
		stepName: PropTypes.string,
		siteType: PropTypes.string,
		headerText: PropTypes.string,
		fieldLabel: PropTypes.string,
		fieldDescription: PropTypes.string,
		fieldPlaceholder: PropTypes.string,
		siteInformationValue: PropTypes.string,
		formFields: PropTypes.array,
		translate: PropTypes.func.isRequired,
		hasMultipleFieldSets: PropTypes.bool,
	};

	static defaultProps = {
		headerText: '',
		fieldLabel: '',
		fieldDescription: '',
		fieldPlaceholder: '',
		formFields: [],
	};

	constructor( props ) {
		super( props );
		this.state = reduce(
			props.formFields,
			( result, fieldName ) => {
				result[ fieldName ] = props.siteInformation[ fieldName ] || '';
				return result;
			},
			{}
		);
	}

	componentDidMount() {
		SignupActions.saveSignupStep( {
			stepName: this.props.stepName,
		} );
	}

	handleInputChange = ( { currentTarget: { name = '', value = '' } } ) =>
		this.setState( { [ name ]: value }, () => this.props.updateStep( name, value ) );

	handleSubmit = event => {
		event.preventDefault();
		this.props.submitStep( this.props.siteInformation, this.props.formFields );
	};

	getFieldTexts( informationType ) {
		const { translate, siteType } = this.props;
		switch ( informationType ) {
			case 'address':
				return {
					fieldLabel: translate( 'Address' ),
					fieldDescription: translate( 'Where can people find your business?' ),
					fieldPlaceholder: 'E.g., 60 29th Street #343, San Francisco, CA 94110',
				};
			case 'phone':
				return {
					fieldLabel: translate( 'Phone number' ),
					fieldDescription: translate( 'How can people contact you?' ),
					fieldPlaceholder: translate( 'E.g. (555) 555-5555' ),
				};
			case 'title':
				return {
					fieldLabel: getSiteTypePropertyValue( 'slug', siteType, 'siteTitleLabel' ) || '',
					fieldPlaceholder:
						getSiteTypePropertyValue( 'slug', siteType, 'siteTitlePlaceholder' ) || '',
					fieldDescription: translate(
						"We'll use this as your site title. Don't worry, you can change this later."
					),
				};
		}
	}

	renderSubmitButton = () => (
		<Button primary type="submit" onClick={ this.handleSubmit }>
			{ this.props.translate( 'Continue' ) }
		</Button>
	);

	renderContent() {
		const { hasMultipleFieldSets, formFields } = this.props;
		return (
			<div
				className={ classNames( 'site-information__wrapper', {
					'has-multiple-fieldsets': hasMultipleFieldSets,
				} ) }
			>
				<form>
					{ formFields.map( fieldName => {
						const fieldTexts = this.getFieldTexts( fieldName );
						const fieldIdentifier = `site-information__${ fieldName }`;
						return (
							<div
								key={ fieldIdentifier }
								className={ classNames( 'site-information__field-control', fieldIdentifier ) }
							>
								<FormFieldset>
									<FormLabel htmlFor={ fieldName }>
										{ fieldTexts.fieldLabel }
										<InfoPopover className="site-information__info-popover" position="top">
											{ fieldTexts.fieldDescription }
										</InfoPopover>
									</FormLabel>
									<FormTextInput
										id={ fieldName }
										name={ fieldName }
										placeholder={ fieldTexts.fieldPlaceholder }
										onChange={ this.handleInputChange }
										value={ this.state[ fieldName ] }
									/>
									{ ! hasMultipleFieldSets && this.renderSubmitButton() }
								</FormFieldset>
							</div>
						);
					} ) }
					{ hasMultipleFieldSets && this.renderSubmitButton() }
				</form>
			</div>
		);
	}

	render() {
		const { flowName, headerText, positionInFlow, signupProgress, stepName } = this.props;
		return (
			<StepWrapper
				flowName={ flowName }
				stepName={ stepName }
				positionInFlow={ positionInFlow }
				headerText={ headerText }
				fallbackHeaderText={ headerText }
				signupProgress={ signupProgress }
				stepContent={ this.renderContent() }
			/>
		);
	}
}

export default connect(
	( state, ownProps ) => {
		const siteType = getSiteType( state );
		const isBusiness = 'business' === siteType;
		return {
			// Only business site types may show the full set of fields.
			// This is a bespoke check until we implement a business-only flow,
			// whereby the flow will determine the available site information steps.
			formFields:
				! isBusiness && 'site-information' === ownProps.stepName
					? [ 'title' ]
					: ownProps.informationFields,
			siteInformation: getSiteInformation( state ),
			siteType,
			hasMultipleFieldSets: size( ownProps.informationFields ) > 1,
			isBusiness,
		};
	},
	( dispatch, ownProps ) => {
		return {
			submitStep: ( siteInformation, formFields ) => {
				const submitData = {};
				const tracksEventData = {};
				each( formFields, key => {
					submitData[ key ] = trim( siteInformation[ key ] );
					tracksEventData[ `user_entered_${ key }` ] = !! siteInformation[ key ];
				} );
				dispatch( setSiteInformation( submitData ) );
				dispatch(
					recordTracksEvent( 'calypso_signup_actions_submit_site_information', tracksEventData )
				);

				// Create site
				SignupActions.submitSignupStep(
					{
						processingMessage: i18n.translate( 'Populating your contact information.' ),
						stepName: ownProps.stepName,
						flowName: ownProps.flowName,
					},
					[],
					submitData
				);
				ownProps.goToNextStep( ownProps.flowName );
			},
			updateStep: ( name, value ) => dispatch( setSiteInformation( { [ name ]: value } ) ),
		};
	}
)( localize( SiteInformation ) );
