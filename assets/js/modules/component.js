define(['modules/fn', 'modules/context-menu'], function (fn, ContextMenu) {

    var ComponentModel = Backbone.Model.extend({

        defaults: {
            state: 'blank',
            templateId: null,
            sortable: false
        }

    });

    var Component = gallery.backbone.views.Component = Backbone.View.extend({

        tagName: 'div',

        attributes: {
            'class': 'component add-component-context-menu',
            'data-state': 'blank'
        },

        initialize: function (properties) {

            _.bindAll(this);

            // Model
            this.model = new ComponentModel(properties);

            // Model bindings
            this.modelBinder = new Backbone.ModelBinder();

            // Template
            this.templates = {
                component: Handlebars.compile($('#template-component').html()),
                componentAdd: Handlebars.compile($('#template-component-add').html()),
                contextMenuItems: Handlebars.compile($('#template-context-menu-items').html())
            };

            // Render
            this.$el.append(this.templates.component());

            // Model bindings
            this.modelBinder.bind(this.model, this.el, {
                state: [{
                    selector: '',
                    elAttribute: 'data-state'
                },{
                    selector: '[data-model="state"]',
                    elAttribute: 'class',
                    converter: function (direction, value) {
                        return ( value === 'fixed' ) ? 'hidden' : '';
                    }
                }],
                sortable: {
                    selector: '[data-model="sortable"]',
                    elAttribute: 'class',
                    converter: function (direction, value) {
                        return ( value === true ) ? '' : 'hidden';
                    }
                }
            });

            // Sidebar
            this.sidebar = gallery.app.views.sidebar;

            // Dom vars
            this.$inner = this.$el.find('.component-inner');

            // Context menu
            this.contextMenuTimer = null;
            this.contextMenu = null;

            // Render the component
            if ( this.model.get('templateId') !== null ) {

                this.renderComponent();
            }

        },

        events: {
            'click .add': 'contextMenuAction',
            'click .component-actions .edit': 'contextMenuAction',
            'click .component-actions .remove': 'remove',
            'mouseleave': 'hideContextMenu'
        },

        contextMenuAction: function (e) {

            var menuItems = [{
                label: 'Followers',
                icon: 'icon-followers',
                templateId: 'template-component-followers',
                contextMenuTemplateId: 'template-context-menu-followers-properties'
            },{
                label: 'Following',
                icon: 'icon-following',
                templateId: 'template-component-following',
                contextMenuTemplateId: 'template-context-menu-following-properties'
            },{
                label: 'Groups',
                icon: 'icon-groups',
                templateId: 'template-component-groups',
                contextMenuTemplateId: 'template-context-menu-groups-properties'
            },{
                label: 'Tasks',
                icon: 'icon-tasks',
                templateId: 'template-component-tasks',
                contextMenuTemplateId: 'template-context-menu-tasks-properties'
            },{
                label: 'Analytics',
                icon: 'icon-analytics',
                templateId: 'template-component-analytics',
                contextMenuTemplateId: 'template-context-menu-analytics-properties'
            },{
                label: 'Radian6 Topic Analysis',
                icon: 'icon-circlegraph2',
                templateId: 'template-component-radian6',
                contextMenuTemplateId: 'template-context-menu-radian6-properties'
            }];

            e.preventDefault();

            // Check if this menu has been created
            if ( this.contextMenu !== null ) {

                this.contextMenu.toggle();

            } else {

                e.currentTarget = this.el;

                this.contextMenu = new ContextMenu({
                    $trigger: this.$el,
                    model: {
                        templateId: 'template-context-menu',
                        viewTemplates: [
                            this.templates.contextMenuItems({
                                title: 'Components',
                                quickFind: true,
                                items: menuItems
                            })
                        ]
                    }
                });

                // Context menu events for component
                this.contextMenu.previewComponent = this.previewAction;
                this.contextMenu.selectComponent = this.selectPreviewAction;
                this.contextMenu.mouseEnterComponent = this.showContextMenu;
                this.contextMenu.mouseLeaveComponent = this.mouseLeaveContextMenu;
                this.contextMenu.removeComponent = this.removeAction;

                this.contextMenu.delegateEvents(
                    $.extend({}, this.contextMenu.events, {
                        'mouseenter.component .menu-item [data-template-id]': 'previewComponent',
                        'click.component .menu-item [data-template-id]': 'selectComponent',
                        'mouseenter.component': 'mouseEnterComponent',
                        'mouseleave.component': 'mouseLeaveComponent',
                        'click.component .remove': 'removeComponent'
                    })
                );

                this.contextMenu.show();

            }

        },

        mouseLeaveContextMenu: function (e) {

            if ( this.model.get('templateId') === null ) {

                this.model.set('state', 'blank');

                this.$inner.html(this.templates.componentAdd());

            }

        },

        hideContextMenu: function (e) {

            var _this = this;

            if( _this.contextMenu !== null ) {

                this.contextMenuTimer = setTimeout(function() {

                    //_this.contextMenu.hide();

                }, 1000);

            }

        },

        showContextMenu: function (e) {

            if ( this.contextMenuTimer !== null ) {

                //clearTimeout(this.contextMenuTimer);
                    
            }
            
        },

        previewAction: function (e) {

            var
                $target = $(e.currentTarget),
                template = Handlebars.compile($('#' + $target.attr('data-template-id')).html())
            ;

            this.$inner.html(template());

            this.model.set('state', 'preview');

        },

        selectPreviewAction: function (e) {

            var $target = $(e.currentTarget);

            // Once the component is selected, add a new one to the end of the list
            if( this.sidebar.components.last().get('component').model.get('state') !== 'blank' ) {

                this.sidebar.addComponent();
            }

            this.model.set('state', 'active');
            this.model.set('sortable', true);
            this.model.set('templateId', $target.attr('data-template-id'));

        },

        removeAction: function (e) {

            e.preventDefault();

            this.remove();

        },

        remove: function () {

            var _this = this;

            // Find the component to remove
            var componentToRemove = this.sidebar.components.find(function (component) {

                return component.get('component').model.cid === _this.model.cid;
            });

            // Remove it from the collection
            this.sidebar.components.remove(componentToRemove);

            // Remove the context menu
            if ( this.contextMenu !== null ) {

                this.contextMenu.remove();
            }

            // Remove the component
            this.$el.remove();

        },

        renderComponent: function () {

            var template = Handlebars.compile($('#' + this.model.get('templateId')).html());

            this.$inner.html(template());

        },

        render: function () {

            return this.$el;

        }

    });

    return Component;

});