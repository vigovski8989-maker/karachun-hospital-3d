// v20: заставка/главное меню с рисованным фоном
(function(){const sp=$('splash'),L=$('splashL');
 function bg(on){document.body.classList.toggle('menubg',on);sp.classList.toggle('gone',!on);if(on&&L)L.style.display='none'}
 const _sl=showLevels;showLevels=function(){_sl.apply(this,arguments);bg(true)};
 const _cm=closeModal;closeModal=function(){_cm.apply(this,arguments);bg(false)};
 new MutationObserver(()=>{if($('modal').style.display==='none'&&document.body.classList.contains('menubg'))bg(false)}).observe($('modal'),{attributes:true,attributeFilter:['style']});
 const _md=modal;modal=function(h){if(document.body.classList.contains('menubg')&&!/Выбор уровня/.test(h))bg(false);return _md.apply(this,arguments)};
})();
