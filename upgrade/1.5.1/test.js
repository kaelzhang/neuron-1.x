DP.define(['/io/ajax', 'mvp/tpl'], function(K, require, exports, module){

var

BRAND_PROMO_STAGE_SIZE = 1
BRAND_PROMO_STAGE_ITEMS = 5,
MAX_BRAND_PROMO_TITLE_LENGTH = 18,

// switch speed
GLOBAL_SWITCH_DURATION = 500,

// switch interval
GLOBAL_SWITCH_INTERVAL = 6E3,

EVENTS_HOT_PROMO = {
    active: function(e){
        var cls = this.get('curCls');
            
        this.curTrigger.removeClass(cls);
        this.curTrigger = e.trigger.addClass(cls);
    }
},

ON_NAV_ENABLE = function (nav) {
    nav && nav.css({
        cursor: 'pointer',
        opacity: 1
    });
},

ON_NAV_DISABLE = function (nav) {
    nav && nav.css({
        cursor: 'default',
        opacity: .3
    });
},

$ = K.DOM,

Ajax = require('io/ajax'),

Tpl = require('mvp/tpl');


/**
 * get promotion ids to prevent duplication
 */
function getPromoIds(list) {
    return list.getAttribute('data-promo-id');
};


function limitSidePromoDetail(data){
    data.forEach(function(d) {
        d.shortshop = sizeLimit(8, d.shop);
        d.shortpromo = sizeLimit(10, d.promo);
        d.shortcutpromo = sizeLimit(15 - d.shortshop.length, d.promo);
    });

    return data;
};


function main(config){
    new Ajax({
        url: '/promo/ajax/getAllBrandPromo',
        data: {
            promoBrandIds: $.all('#brand-promo li').el().map(getPromoIds).join(',')
        }
        
    }).on({
        success: initBrandPromos
    }).send();
    
    initNav({
        maxHeight: 500
    });
  
    // hot promo
    new ContentFactory({
        template: $('#J_tpl-hot-promo').html(),
        remote: '/promo/ajax/promoHotListGet',
        CSPre: '#hot-promo',
        containerCS: '.con',
        dataGetter: getShopType,
        curCls: 'cur',
        triggerCS: '.tabs a',
        parser: function(data) {
            data.forEach(function(d) {
                d.shortshop = sizeLimit(12, d.shop);
                d.shortpromo = sizeLimit(16, d.promo);
            });

            return data;
        }
        
    }).on(EVENTS_HOT_PROMO);
    
    // latest-promo
    new ContentFactory({
        template: $('#J_tpl-latest-promo').html(),
        remote: '/promo/ajax/promoNewListGet',
        CSPre: '#latest-promo',
        containerCS: '.con',
        dataGetter: getShopType,
        curCls: 'cur',
        triggerCS: '.tabs a',
        parser: function(data) {
            data.ENUM = config.shopTypeIconMap;

            data.forEach(function(d) {
                d.shortshop = sizeLimit(12, d.shop);
                d.shortpromo = sizeLimit(32, d.promo);
            });

            return data;
        }
        
    }).on(EVENTS_HOT_PROMO);
    
    // newshop promo
    new ContentFactory({
        template: $('#J_tpl-side-promo').html(),
        remote: '/promo/ajax/promoNewShopRandomGet',
        CSPre: '#newshop-promo',
        triggerCS: '.J_change',
        containerCS: '.news-list',
        parser: limitSidePromoDetail
    });
    
    // recommended promo
    new ContentFactory({
        template: $('#J_tpl-side-promo').html(),
        remote: '/promo/ajax/promoRecommendShopRandomGet',
        CSPre: '#recommended-promo',
        triggerCS: '.J_change',
        containerCS: '.news-list',
        parser: limitSidePromoDetail
    });
    
    // initialize user location map
    DP.provide('promo::locmap', initUserLocMap);

    // initialize email subscription
    DP.provide('promo::sub', function (K, sub) {
        sub($('#J_sub-email'), $('#J_sub-btn'));
    });

    initLazyload();
};


function getShopType(el){
    return {
        shoptype: parseInt( el.attr('data-shop-type') )
    };  
};

/**
 * data parser for new shop and recommended promotions
 */
function generateDataParser(size) {
    return function (obj) {
        var promoName = obj.promo,
        shopName = obj.shop;

        obj.title = '[' + shopName + '] ' + promoName;
        obj.shortshop = sizeLimit(size - 2, shopName);
        obj.shortpromo = sizeLimit(size, promoName);

        return obj;
    }
};

function sizeLimit(size, str) {
    return str.length > 
        // not include the letter at `size`
        size ? str.substr(0, size - 1) + String.fromCharCode('8230') 
        : str;
};

function initLazyload(){
DP.provide('dom/dimension', function(K, Dimension) {

var

WIN = $(window);

Lazyload = K.Class({
    Implements: 'attrs events',

    initialize: function(options) {
        this.set(options);

        K.bind('_scroll', this);
    },

    addItem: function(item) {
        this.imgs.concat($(item).get());
    },

    start: function() {
        WIN.on({
            scroll: this._scroll,
            resize: this._scroll
        });

        this._scroll();
    },

    pause: function() {
        WIN.off({
            scroll: this._scroll,
            resize: this._scroll
        });
    },

    _scroll: function() {
        var
        height = Dimension.size(document).height,
        scroll = Dimension.scroll(document).top,
        i = 0,
        img,
        tolerance = this.get('tolerance');

        for(; i < this.imgs.length; i ++){
            img = this.imgs[i];

            // make sure the image is still in the DOM
            if(!img || !img.parentNode || this._testImg(img, height, scroll, tolerance)){
                this._load(this.imgs.splice(i --, 1)[0]);
            }
        }        

    },

    _load: function(img) {
        img.src = img.getAttribute(this.get('lazyAttr'));
    },

    _testImg: function(img, height, scroll, tolerance) {
        var
        offsetTop = Dimension.offset(img).top;

        return offsetTop < scroll + height + tolerance;
    }

});

K.Class.setAttrs(Lazyload, {
    CS: {
        setter: function(v) {
            this.imgs = $.all(v).el();
        }
    },

    lazyAttr: {
        value: 'data-src'
    },

    tolerance: {
        value: 50,
        validator: K.isNumber
    }
});

new Lazyload({
    CS: '.J_lazy-img'

}).start();

});

};


function initBrandPromos(rt) {
    DP.provide(['switch/core'], function (K, Switch) {
        var 
        
        template = Tpl.parse($('#J_tpl-brand-promo').html()),
        parser = generateDataParser(MAX_BRAND_PROMO_TITLE_LENGTH),

        CSpre = '#brand-promo',
        data = K.makeArray(rt.msg.brandPromoList);

        new Switch().plugin('step', 'carousel', 'endless' /*, 'autoPlay' */ ).on({
            afterInit: function () {
                $(CSpre).addClass('J_switch-active');

                var self = this,
                container = self.container,
                space = self.get('itemSpace');

                // container.parent().css('height', container.css('height'));
                container.addClass('J_switch-rebuild');

                self.items.forEach(function (item, i) {
                    item.css('left', i * space);
                });
            },
            
            navEnable: ON_NAV_ENABLE,
            navDisable: ON_NAV_DISABLE

        }).init({
            stage: BRAND_PROMO_STAGE_SIZE,
            move: BRAND_PROMO_STAGE_SIZE,
            CSPre: CSpre,
            itemCS: 'ul',
            containerCS: '.pic-list',
            prevCS: '.prev',
            nextCS: '.next',
            direction: 'left',
            fx: {
                duration: GLOBAL_SWITCH_DURATION
            },

            // interval: GLOBAL_SWITCH_INTERVAL,
            dataLength: Math.ceil( data.length / BRAND_PROMO_STAGE_ITEMS ),
            itemSpace: 675,
            itemRenderer: function (index) {
                var list = data.slice((index - 1)* BRAND_PROMO_STAGE_ITEMS, index * BRAND_PROMO_STAGE_ITEMS );

                list.forEach(parser);

                return $.create('div').html(template(list)).child();
            }
        });
    });
};


function initNav(opt){
    var CURRENT = 'cur',
        maxHeight = opt.maxHeight,
        lis = $.all('.cop-nav .cn-nav'),
        cur;
    
DP.provide(['dom/dimension', 'event/multi'], function (D, Di, Multi) {

    lis.forEach(function(el,i){
        var li = $(el),
            item = li.child('.n-item'),
            sub = li.one('.n-pop'),
            shown,

            h = sub.css('height'),
            more = item.one('.more');

        if(!more.count()){
            return;
        }

        function show(e){ 
            if(shown){
                return;
            }

            shown = true;

            lis.removeClass(CURRENT);
            li.addClass(CURRENT);
        }

        function hide(e){
            li.removeClass(CURRENT);
            shown = false;
        }

        var multiShow = new Multi(show, 250),
            multiHide = new Multi(hide, 250);

        multiShow.addTrigger(li, 'mouseenter');
        multiShow.addStopper(li, 'mouseleave');

        multiHide.addTrigger(li, 'mouseleave');
        multiHide.addStopper(li, 'mouseenter');

    });
});

};


function initUserLocMap(K, LocMap) {
    var 

    locMap = new LocMap({
        parser: {
            live: {
                live_list: '_list',
                live_poi: '_poi',
                live_city: '_city'
            },

            work: {
                work_list: '_list',
                work_poi: '_poi',
                work_city: '_city'
            }
        }
    }),

    container = $('#nearby-promo');

    $.all('.J_add-residence').on('click', function (e) {
        e.prevent();
        locMap.switchTo('live', '住所', 1);
        locMap.open($(this));
    });

    $.all('.J_add-workplace').on('click', function (e) {
        e.prevent();
        locMap.switchTo('work', '工作地', 2);
        locMap.open($(this));
    });

    DP.provide('switch/core', function(D, Switch) {
        new Switch().plugin('tabSwitch').on({
            completeSwitch: function() {
                container[ this.activeIndex === 0 ? 'removeClass' : 'addClass' ]('J_workplace-on');
            }
        }).init({
            CSPre: '#nearby-promo',
            itemCS: '.switch-cont',
            itemOnCls: 'switch-cont-on',
            triggerCS: '.tabs a',
            triggerOnCls: 'cur',
            containerCS: '.con',
            triggerType: 'click'
        });
    });
};


function RETURN_ATOM(){
    return ATOM;
};


var

ATOM = {},

ContentFactory = K.Class({
    Implements: 'attrs events',

    initialize: function(options){
        var self = this;
    
        ['CSPre'].forEach(function(key){
            self.set(key, options[key]);
        
            delete options[key];
        });
    
        this.set(options);
        
        this.curTrigger = $( this.get('CSPre') + this.get('triggerCS') + '.' + this.get('curCls') );
    },
    
    _fetchContent: function(data){
        var self = this;
    
        new Ajax({
            url: this.get('remote'),
            data: K.mix({}, data),
            method: 'post',
            
            isSuccess: function(rt){
                return rt && rt.code === 200 && rt.msg;
            }
        }).on({
            success: function(rt){
                // make sure list is always
                var list = self.get('parser')( K.makeArray( rt.msg.promolist || [] ) );
                
                self._applyContent(self.template(list));
            }
        }).send()
    },
    
    _applyContent: function(content){
        this.container.html(content);
    }
     
});

K.Class.setAttrs(ContentFactory, {
    template: {
        setter: function(v){
            return this.template = Tpl.parse(v);
        }
    },
    
    containerCS: {
        setter: function(v){
            this.container = $(this.get('CSPre') + v);
        }
    },
    
    dataGetter: {
        validator: K.isFunction,
        getter: function(v){
            return v || RETURN_ATOM;
        }  
    },

    parser: {
        value: function(v) {
            return v;
        }
    },
    
    CSPre: {
        value: '',
        setter: function(v){
            return v ? v + ' ' : '';
        }
    },
    
    nocache: {},
    remote: {},
    curCls: {},
    triggerCS: {
        setter: function(v){
            var self = this;
        
            self.triggers = $.all(self.get('CSPre') + v).on({
                click: function(e){
                    e.prevent();

                    var el = $(this),
                        content;
                    
                    if(self.get('curCls') && el.hasClass(self.get('curCls'))){
                        return;
                    }

                    self._fetchContent(self.get('dataGetter')(el));
                    
                    self.fire('active', {trigger: el});
                }
            });
            
            return v;
        }
    }
});



exports.init = function(config){
    DP.ready(function() {
        main(config)
    });
};

    
});