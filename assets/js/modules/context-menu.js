define(['modules/fn'], function (fn) {

    var ContextMenuModel = Backbone.Model.extend({

        defaults: {
            type: 'panel',
            position: 'left',
            visible: false,
            display: false,
            quickFind: false
        }

    });

    var ContextMenu = gallery.backbone.views.ContextMenu = Backbone.View.extend({

        tagName: 'div',

        attributes: {
            'class': 'context-menu',
            'data-visible': 'false'
        },

        initialize: function (params) {

            _.bindAll(this);

            // Params
            this.params = params;

            // Model
            this.model = new ContextMenuModel(this.params.model);
            this.modelBinder = new Backbone.ModelBinder();

            // Template
            this.template = Handlebars.compile($('#' + this.model.get('templateId')).html());

            // Views
            this.currentView = 0;

            this.render();

        },

        events: {
            'click .menu-item .view-next': 'viewNext',
            'click .view-previous': 'viewPrevious',
            'mouseleave': 'hide'
        },

        viewNext: function (e) {

            e.preventDefault();

            var
                $target = $(e.currentTarget),
                templateNext = null
            ;

            this.currentView++;

            // Check to see if the template needs to be rendered
            if ( $target.attr('data-context-menu-template-id') !== undefined ) {

                templateNext = Handlebars.compile($('#' + $target.attr('data-context-menu-template-id')).html());

                // Append the template
                this.$inner.append(templateNext);

                // Remove the template id so it's not rendered again
                //$target.removeAttr('data-template-id');

                // Recollect the views
                this.$views = this.$el.find('.context-menu-view');

            }

            // Set the height of the menu
            this.$inner.css({
                'height': this.$views.eq(this.currentView).outerHeight() + 'px'
            });

            // Transition
            this.$views.css({
                'transform': 'translate3d('+ (-this.width * this.currentView) +'px,0,0)'
            });

        },

        viewPrevious: function (e) {

            e.preventDefault();

            var $target = $(e.currentTarget);

            // Remove the view
            this.$views.eq(this.currentView).remove();

            this.currentView--;            

            // Recollect the views
            this.$views = this.$el.find('.context-menu-view');

            // Set the height of the menu
            this.$inner.css({
                'height': this.$views.eq(this.currentView).outerHeight() + 'px'
            });

            // Transition
            this.$views.css({
                'transform': 'translate3d('+ (-this.width * this.currentView) +'px,0,0)'
            });

        },

        show: function () {
            
            var _this = this;

            this.setPosition();

            this.model.set('display', true);

            setTimeout(function(){
                _this.model.set('visible', true);
            }, 10);

        },

        hide: function () {

            var _this = this;

            this.model.set('visible', false);

            setTimeout(function(){
                _this.model.set('display', false);
            }, 500);

        },

        toggle: function () {

            if( this.model.get('visible') === true ) {

                this.hide();

            } else {

                this.show();

            }

        },

        setPosition: function () {

            var
                _this = this,
                $trigger = this.params.$trigger,
                triggerOffset = $trigger.offset(),
                triggerWidth = $trigger.outerWidth()
            ;

            if ( this.model.get('position') === 'left' ) {

                this.$el.css({
                    'left': $trigger.offset().left - this.$el.outerWidth() + 'px',
                    'top': $trigger.offset().top + 'px'
                });

            }
            else if (this.model.get('position') === 'right') {

                this.$el.css({
                    'left': $trigger.offset().left + $trigger.outerWidth() + 'px',
                    'top': $trigger.offset().top + 'px'
                });

            }
            else if (this.model.get('position') === 'top') {

                this.$el.css({
                    'left': triggerOffset.left + (triggerWidth / 2) - (this.$el.outerWidth() / 2) + 'px',
                    'top': triggerOffset.top - this.$el.outerHeight() + 'px'
                });

            }
            else if (this.model.get('position') === 'bottom') {

                this.$el.css({
                    'left': triggerOffset.left + (triggerWidth / 2) - (this.$el.outerWidth() / 2) + 'px',
                    'top': triggerOffset.top + 'px'
                });

            }

        },

        render: function () {

            var
                _this = this,
                $trigger = this.params.$trigger,
                triggerOffset = $trigger.offset(),
                triggerWidth = $trigger.outerWidth()
            ;

            // Attributes
            this.$el.attr('data-position', this.model.get('position'));
            this.$el.attr('data-type', this.model.get('type'));

            // Create menu
            this.$el.append(this.template(this.model.toJSON()));

            // Append the menu
            $('#dale-app').append(this.$el);

            // Set some other vars
            this.$inner = this.$el.find('.context-menu-inner');
            this.$views = this.$el.find('.context-menu-view');
            this.width = this.$el.outerWidth();

            // Set the height of the menu
            this.$el.find('.context-menu-inner').css({
                'height': this.$views.first().height() + 'px'
            });

            // Position
            this.setPosition();

            // Model bindings
            this.modelBinder.bind(this.model, this.el, {
                visible: {
                    selector: '',
                    elAttribute: 'data-visible'
                },
                display: {
                    selector: '',
                    elAttribute: 'class',
                    converter: function (direction, value) {
                        return ( value === true ) ? '' : 'hide';
                    }
                }
            });

        }

    });

    return ContextMenu;

});