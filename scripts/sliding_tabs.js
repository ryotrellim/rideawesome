/*****************************************************
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * <http://www.gnu.org/licenses/>
 * 
 * Copyright 2007 Matthew Weltman <meweltman@yahoo.com>
 *
 *
 * options:
 * The third argument (much like many mootools plugins) are options, they are:
 * active_tab_class - The className of the active tab.
 * scroll_fx_duration - The duration of the scroll between tabs.  For no effect set to 0. Defaults to 500.
 * 
 * To create horizontal tabs:
 * orientation - set to 'horizontal'
 * tab_margin_left - The margin to the left of the left-most tab
 * tab_margin_right - The margin to the right of the right-most tab
 * 
 * To create vertical tabs (note: your tabs must have a set height):
 * orientation - set to 'vertical'
 * tab_margin_top - The margin to the left of the left-most tab
 * tab_margin_bottom - The margin to the right of the right-most tab
 * 
 * -silding tabs can reposition itself to the center of a container or window (see below).
 * to accomplish this you need to enable 3 options
 * container_reposition - set this to true
 * container - the container your tabs are in
 * outer_container - the container you want the tabs to center inside of.  To center in the window, set to 'window'
 * offset - The offset +/- where the container will be centered
 *
 */
var sliding_tabs = new Class({
	initialize:function(tabs, bodies, options){
		this.options = {
			active_tab_class: 'active_tab',
			tab_margin_left: '10px',
			tab_margin_right: '10px',
			tab_margin_top: '10px',
			tab_margin_bottom: '10px',
			scroll_fx_duration:500,
			event:'click',
			orientation:'horizontal',
			scroll_orientation:'vertical',
			//used for container repositioning
			container_reposition: false,
			container:null,
			offset:null,
			outer_container:null,
            initial_tab:0,
            classes:{
				tab_overflow:'tab_overflow',
				tab_container:'tab_container',
				tab_body_container:'tab_body_container'
			}
		}
		var classes = this.options.classes;
		$extend(classes,options.classes);
		$extend(this.options,options);
		this.options.classes=classes;
		if(this.options.orientation=='horizontal'){
			this.flow = 'left';
			this.side = 'right';
			this.dim = 'width';
			this.cart = 'x';
		}else{
			this.flow = 'top';
			this.side = 'bottom';
			this.dim = 'height';
			this.cart = 'y';
		}
		this.bodies = bodies;
		this.tabs = tabs;
		this.tabs.setStyle('position','relative');
		if(this.flow === 'left') {
			this.tabs.setStyle('float', 'left');
		}
	
		this.tab_overflow = new Element('div').setProperty('class',this.options.classes.tab_overflow);
		this.tab_overflow.injectBefore(this.tabs[0]);
	
		this.tab_container = new Element('div').setProperty('class',this.options.classes.tab_container);
		this.tab_container.injectInside(this.tab_overflow);
		
		this.tab_body_container = new Element('div').setProperty('class',this.options.classes.tab_body_container);
		this.tab_body_container.injectBefore(this.bodies[0]);
		if(this.options.orientation!='horizontal')
			this.tab_overflow.setStyle('float','left');
		
		this.bodies.each(function(el,i){
			el.injectInside(this.tab_body_container);
		}.bind(this));
		
		if(this.options.container_reposition){
			if(this.options.outer_container.toLowerCase() == 'window')
				this.outer_container_dim = this.options.scroll_orientation=='vertical'?Window.getSize().height:Window.getSize().width;
			else
				this.outer_container_dim = this.options.scroll_orientation=='vertical'?$(this.options.outer_container).getStyle('height').toInt():$(this.options.outer_container).getStyle('width').toInt();
			this.scroll_flow=this.options.scroll_orientation=='vertical'?'top':'left';
			this.container_fx = new Fx.Tween($(this.options.container),{link:'cancel'});
		}
		
		this.body_fx = new Fx.Scroll(this.tab_body_container,{link:'cancel',duration:this.options.scroll_fx_duration});
		
		this.tab_items = [];
		this.tabs_dim = 0;
		
		this.tabs.each(function(el,i){
			this.tabs_dim += el.getStyle(this.dim).toInt()
				+ el.getStyle('border-'+this.side+'-width').toInt()
				+ el.getStyle('border-'+this.flow+'-width').toInt()
				+ el.getStyle('margin-'+this.flow).toInt()
				+ el.getStyle('margin-'+this.side).toInt()
				+ el.getStyle('padding-'+this.flow).toInt()
				+ el.getStyle('padding-'+this.side).toInt()
			el.injectInside(this.tab_container);
			el.setStyle(this.flow,this.options['tab_margin_'+this.flow]);
			this.tab_items[i] = new tab_item(el,this.bodies[i],this);
		}.bind(this));
		
		this.tab_container.setStyle(this.dim,(this.tabs_dim+this.options['tab_margin_'+this.flow].toInt()+this.options['tab_margin_'+this.side].toInt())+'px');
		
		this.tab_fx = new Fx.Scroll(this.tab_overflow,{
			duration:300,
			link:'cancel',
			onComplete:function(){
				this.tab_overflow.addEvent('mousemove',this.mouse_move.bind(this));
			}.bind(this)
		});
		
		this.tab_overflow.addEvent('mouseenter',function(e){
			e = new Event(e).stop();
			if(this.options.orientation=='horizontal')
				this.tab_fx.start(this.get_position(e));
			else
				this.tab_fx.start(0,this.get_position(e));
		}.bind(this));
		
		this.tab_overflow.addEvent('mouseleave',function(){
			this.tab_overflow.removeEvents('mousemove');
		}.bind(this));
		
		this.active_item = this.tab_items[this.options.initial_tab];
		this.tabs[this.options.initial_tab].addClass(this.options.active_tab_class)
		this.tab_body_container.setStyle(this.tab_items[this.options.initial_tab].dim,this.tab_items[this.options.initial_tab].body_dim);
		this.body_event_fx = new Fx.Tween(this.tab_body_container,{duration:500,link:'cancel'});
        new Fx.Scroll(this.tab_body_container,{link:'cancel',duration:0}).toElement(this.tab_items[this.options.initial_tab].body);
        new Fx.Scroll(this.tab_overflow,{link:'cancel',duration:0}).toElement(this.tab_items[this.options.initial_tab].item);
	},
	mouse_move:function(e){
		e = new Event(e).stop();
		this.tab_fx.cancel();
		if(this.options.orientation=='horizontal')
			this.tab_overflow.scrollLeft = this.get_position(e);
		else
			this.tab_overflow.scrollTop = this.get_position(e);
	},
	get_position:function(e){
		var pos = this.tab_overflow.getPosition();
		var scroll = this.tab_overflow.getScroll();
		var scrollPos = Window.getScroll()[this.cart]+e.client[this.cart]-(pos[this.cart]+scroll[this.cart]);
		var position = scrollPos*(this.tab_container.getStyle(this.dim).toInt())/this.tab_overflow.getStyle(this.dim).toInt() - scrollPos;
		return position;
	}
});

var tab_item = new Class({
	initialize:function(item,body,tab_obj){
		this.item = item;
		this.body = body;
		this.tab_obj = tab_obj;
		this.dim=this.tab_obj.options.scroll_orientation=='vertical'?'height':'width';
		if(this.tab_obj.options.scroll_orientation=='vertical')
			this.body_dim =
				(
				this.body.getStyle('height').toInt()
				+ this.body.getStyle('border-bottom-width').toInt()
				+ this.body.getStyle('border-top-width').toInt()
				+ this.body.getStyle('margin-bottom').toInt()
				+ this.body.getStyle('margin-top').toInt()
				+ this.body.getStyle('padding-bottom').toInt()
				+ this.body.getStyle('padding-top').toInt()
				)+'px';
		else{
			this.body_dim =
				(
				this.body.getStyle('width').toInt()
				+ this.body.getStyle('border-right-width').toInt()
				+ this.body.getStyle('border-left-width').toInt()
				+ this.body.getStyle('margin-right').toInt()
				+ this.body.getStyle('margin-left').toInt()
				+ this.body.getStyle('padding-right').toInt()
				+ this.body.getStyle('padding-left').toInt()
				)+'px';
			this.body.setStyle('float','left');
		}
		
		this.item.addEvent(this.tab_obj.options.event,this.on_event.bind(this));
		
		this.container_flow = (
			this.tab_obj.outer_container_dim-
			this.body_dim.toInt()+
			this.tab_obj.options.offset
			)/2;
	},
	on_event:function(e){
		e = new Event(e).stop();
		if($defined(this.tab_obj.active_item))
    		this.tab_obj.active_item.item.removeClass(this.tab_obj.options.active_tab_class);
		this.item.addClass(this.tab_obj.options.active_tab_class);
		
		if(this.tab_obj.options.container_reposition){
			this.tab_obj.container_fx.start(this.tab_obj.scroll_flow,this.container_flow+'px');
		}
		this.tab_obj.body_event_fx.removeEvents('complete');
		this.tab_obj.body_event_fx.addEvent('complete',function(){
				this.tab_obj.body_fx.toElement(this.body);
				this.tab_obj.active_item = this;
			}.bind(this)
		);
		this.tab_obj.body_event_fx.start(this.dim,this.body_dim);
	}
});
