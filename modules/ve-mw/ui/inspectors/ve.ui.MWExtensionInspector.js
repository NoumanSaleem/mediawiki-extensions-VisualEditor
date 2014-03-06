/*!
 * VisualEditor UserInterface MWExtensionInspector class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * MediaWiki extension inspector.
 *
 * @class
 * @abstract
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {ve.ui.Surface} surface Surface inspector is for
 * @param {Object} [config] Configuration options
 */
ve.ui.MWExtensionInspector = function VeUiMWExtensionInspector( surface, config ) {
	// Parent constructor
	ve.ui.Inspector.call( this, surface, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWExtensionInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.MWExtensionInspector.static.placeholder = null;

ve.ui.MWExtensionInspector.static.nodeView = null;

ve.ui.MWExtensionInspector.static.nodeModel = null;

ve.ui.MWExtensionInspector.static.removable = false;

/**
 * Extension is allowed to have empty contents
 *
 * @static
 * @property {boolean}
 * @inheritable
 */
ve.ui.MWExtensionInspector.static.allowedEmpty = false;

/* Methods */

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.MWExtensionInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.Inspector.prototype.initialize.call( this );

	this.input = new OO.ui.TextInputWidget( {
		'$': this.$,
		'overlay': this.surface.$localOverlay,
		'multiline': true
	} );
	this.input.$element.addClass( 've-ui-mwExtensionInspector-input' );

	// Initialization
	this.$form.append( this.input.$element );
};

/**
 * Get the placeholder text for the content input area.
 *
 * @returns {string} Placeholder text
 */
ve.ui.MWExtensionInspector.prototype.getInputPlaceholder = function () {
	return '';
};

/**
 * @inheritdoc
 */
ve.ui.MWExtensionInspector.prototype.setup = function ( data ) {
	var dir,
		fragment = this.surface.getModel().getFragment( null, true );

	// Parent method
	ve.ui.Inspector.prototype.setup.call( this, data );

	// Initialization
	this.node = this.surface.getView().getFocusedNode();
	// Make sure we're inspecting the right type of node
	if ( !( this.node instanceof this.constructor.static.nodeView ) ) {
		this.node = null;
	}
	this.input.setValue( this.node ? this.node.getModel().getAttribute( 'mw' ).body.extsrc : '' );

	this.input.$input.attr( 'placeholder', this.getInputPlaceholder() );

	// By default, the direction of the input element should be the same
	// as the direction of the content it applies to
	if ( this.node ) {
		// The node is being edited
		dir = this.node.$element.css( 'direction' );
	} else {
		// New insertion, base direction on the fragment range
		dir = this.surface.getView().documentView.getDirectionFromRange( fragment.getRange() );
	}
	this.input.setRTL( dir === 'rtl' );
};

/**
 * @inheritdoc
 */
ve.ui.MWExtensionInspector.prototype.ready = function () {
	// Parent method
	ve.ui.Inspector.prototype.ready.call( this );

	// Focus the input
	this.input.$input.focus().select();
};

/**
 * @inheritdoc
 */
ve.ui.MWExtensionInspector.prototype.teardown = function ( data ) {
	var mwData,
		surfaceModel = this.surface.getModel();

	if ( this.constructor.static.allowedEmpty || this.input.getValue() !== '' ) {
		if ( this.node instanceof this.constructor.static.nodeView ) {
			mwData = ve.copy( this.node.getModel().getAttribute( 'mw' ) );
			this.updateMwData( mwData );
			surfaceModel.change(
				ve.dm.Transaction.newFromAttributeChanges(
					surfaceModel.getDocument(), this.node.getOuterRange().start, { 'mw': mwData }
				)
			);
		} else {
			mwData = {
				'name': this.constructor.static.nodeModel.static.extensionName,
				'attrs': {},
				'body': {}
			};
			this.updateMwData( mwData );
			surfaceModel.getFragment().collapseRangeToEnd().insertContent( [
				{
					'type': this.constructor.static.nodeModel.static.name,
					'attributes': {
						'mw': mwData
					}
				},
				{ 'type': '/' + this.constructor.static.nodeModel.static.name }
			] );
		}
	}

	// Parent method
	ve.ui.Inspector.prototype.teardown.call( this, data );
};

/**
 * Update mwData object with the new values from the inspector
 *
 * @param {Object} mwData MediaWiki data object
 */
ve.ui.MWExtensionInspector.prototype.updateMwData = function ( mwData ) {
	mwData.body.extsrc = this.input.getValue();
};
