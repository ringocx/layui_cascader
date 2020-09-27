"use strict";

layui.define(['jquery', 'laytpl'], function (e) {
  var mod = 'cascader';

  var $ = layui.$, tpl = layui.laytpl;

  var sys = {
    class: {
      container: 'layui-rc-cascader',
      inputBox: 'cascader-input',
      input: 'cascader-input__inner',
      inputSuffix: 'cascader-input__suffix',
      tags: 'cascader-tags',
      dropdown: 'cascader-dropdown',
      dropdownPanel: 'cascader-dropdown-panel',
      dropdownDl: 'cascader-dropdown-dl',
      dropdownDd: 'cascader-dropdown-dd',
      selectup: 'layui-selectup'
    },
    template: {
      main: '<div class="{{d.cls.container}}"><div class="{{d.cls.inputBox}} cascader-input--suffix"><input type="text" readonly placeholder="{{d.opts.placeholder}}" class="{{d.cls.input}} layui-input" /><span class="{{d.cls.inputSuffix}} layui-icon layui-icon-triangle-d"></span></div><div class="{{d.cls.dropdown}} layui-anim layui-anim-upbit"><div class="{{d.cls.dropdownPanel}}"></div></div>{{# if (d.opts.multiple) { }}<div class="{{d.cls.tags}}"></div>{{# } }}</div>',
      dropdownDl: '<div class="{{d.cls.dropdownDl}}">{{# layui.each(d.list, function(i, e){ }}<div class="{{d.cls.dropdownDd}}" data-v="{{e.value}}"><span>{{e.label}}</span>{{# if (e.children.length > 0) { }}<i class="layui-icon layui-icon-right"></i>{{# } }}<i class="layui-icon layui-icon-ok"></i></div>{{# }); }}</div>',
    }
  };

  var selected = []

  var Cascader = function (opts) {
    var _s = this;
    _s.config = $.extend({}, _s.config, opts);
    _s.render();
  }

  Cascader.prototype.config = {
    elem: '',
    options: [],
    multiple: false,
    clearable: false,
    collapseTags: false,
    filterable: false,
    showAllLevels: true,
    placeholder: '请选择',
    separator: '/',
    valueSeparator: ',',
    groupSeparator: '|',
    props: {
      label: 'label',
      value: 'value',
      children: 'children'
    },
    debounce: 300
  };

  Cascader.prototype.render = function () {
    var _s = this, _e = this.config.elem;
    $(_e).hide().after(tpl(sys.template.main).render({ cls: sys.class, opts: _s.config }));
    _s.renderData([]), _s.eventRegister();
  }

  Cascader.prototype.eventRegister = function () {
    var _s = this, _e = _s.config.elem, _cls = sys.class, $c = $(_e).next();

    $c.find(`.${_cls.inputBox}`).on('click', _s.onShow.bind(_s));

    $(document).on('click', function (e) {
      var _target = e.target, _item = $c.find(_target);
      if ($c.find(_target).length === 0) {
        _s.onClose.bind(_s)(e);
      }
    });
  }

  Cascader.prototype.renderData = function (tree) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $dp = $c.find(`.${_cls.dropdownPanel}`);
    var _tree = tree;
    var _data = _s.config.options;
    if (_tree.length > 0) {
      _data = _tree.reduce(function (res, e) { 
        var _selected = res.filter(function (_e, _i) { 
          return _e[_s.config.props.value] === e.value 
        });
        _selected = _selected.length > 0 ? _selected[0] : {};
        return _selected.hasOwnProperty(_s.config.props.children) ? _selected[_s.config.props.children] : []; 
      }, _s.config.options);
    }

    $dp.find(`.${_cls.dropdownDl}`).each(function (i, e) {
      if (i >= _tree.length) {
        $(e).remove();
      }
    });
    
    if (_data.length === 0) {
      return;
    }
    _data = _data.map(function (e, i) { 
      return { 
        label: e[_s.config.props.label],
        value: e[_s.config.props.value],
        children: e[_s.config.props.children] || []
      }
    });
    var _$ddList = $(tpl(sys.template.dropdownDl).render({ list: _data, cls: sys.class }));
    _$ddList.appendTo($dp);

    _$ddList.on('click', `.${_cls.dropdownDd}`, function (e) {
      var _ddValue = $(this).data('v').toString();
      var _ddSelected = _data.filter(function (e, i) { return _ddValue === e.value.toString(); })[0];
      var _res = { label: _ddSelected.label, value: _ddSelected.value };
      var _nTree = _tree.concat([_res]);
      _s.renderData(_nTree);
      var index = _nTree.length - 1;
      if (index < 0) { index = 0; }
      selected.splice(index, selected.length - index);
      selected.push(_ddValue);
      _$ddList.find(`.${_cls.dropdownDd}`).removeClass('active');
      if (_ddSelected.children.length > 0) {
        $(this).addClass('active');
      } else {
        _s.onSelect(_nTree)
      }
      _s.highlight();
    });
  }

  Cascader.prototype.onSelect = function (v) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $dp = $c.find(`.${_cls.dropdownPanel}`);
    var _v = _s.getSelectedValue();
    if (_s.config.multiple) {
      var _i = _v.indexOf(_s.convertValue(v));
      var _val;
      if (_i >= 0) {
        _v.splice(_i, 1)
      } else {
        _v = _v.concat(_s.convertValue(v));
      }
      $(_e).val(_v.join(_s.config.groupSeparator));
      _s.showLabel();
    } else {
      $(_e).val(_s.convertValue(v));
      _s.showLabel(), _s.onClose();
    }
  }

  Cascader.prototype.showLabel = function () {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next();

    var _labels = _s.getSelectOptions();

    if (_s.config.multiple) {
      $c.find(`.${_cls.input}`).val(_labels.map(function (e) { return _s.convertInputText(e); }).join('|'));
    } else {
      $c.find(`.${_cls.input}`).val(_s.convertInputText(_labels[0]));
    }
  }

  Cascader.prototype.getSelectOptions = function () {
    var _s = this, _v = _s.getSelectedValue();

    return _v.map(function (el) {
      var _options = _s.config.options;
      return el.split(_s.config.valueSeparator).reduce(function (res, e) {
        var restruct = _options.filter(function (_e) {
          return _e[_s.config.props.value].toString() === e.toString();
        });
        if (restruct.length > 0) {
          res.push(restruct[0]);
          _options = restruct[0][_s.config.props.children] !== undefined ? restruct[0][_s.config.props.children] : [];
        }
        return res
      }, [])
    });
  }

  Cascader.prototype.highlight = function (callback) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $dp = $c.find(`.${_cls.dropdownPanel}`);
    var _v = _s.getSelectedValue();
    var _marginObject = function (arr, obj) {
      var e = arr.shift();
      if (!obj.hasOwnProperty(e)) {
        obj[e] = {}
      }
      if (arr.length > 0) {
        obj[e] = _marginObject(arr, obj[e])
      }
      return obj;
    }
    _v = _v.reduce(function (res, e) {
      return _marginObject(e.split(_s.config.valueSeparator), res);
    }, {});
    $dp.find(`.${_cls.dropdownDd}`).removeClass('selected in-active');
    $dp.find(`.${_cls.dropdownDl}`).each(function (i, e) {
      if (_v === undefined) { return; }
      var _keys = Object.keys(_v);
      if (_keys.length > 0) {
        _keys.forEach(function (_e) {
          $(e).find(`.${_cls.dropdownDd}[data-v="${_e}"]`).addClass(Object.keys(_v[_e]).length > 0 ? (_s.config.multiple ? 'in-active' : '') : 'selected')
        });
        _v = _v[selected[i]]
      }
    })
    if (callback !== undefined) {
      callback.call(this);
    }
  }

  Cascader.prototype.getSelectedValue = function () {
    var _s = this, _e = this.config.elem;
    return $(_e).val() === "" 
      ? []
      : $(_e).val().split(_s.config.groupSeparator);
  }

  Cascader.prototype.convertInputText = function (v) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $input = $c.find(`.${_cls.input}`);
    return _s.config.showAllLevels 
      ? v.map(function (e) { return e.label; }).join(` ${_s.config.separator} `)
      : v[v.length - 1].label;
  }

  Cascader.prototype.convertValue = function (v) {
    var _s = this;
    return v.map(function (e) { return e.value; }).join(_s.config.valueSeparator)
  }

  Cascader.prototype.onShow = function (e) {
    var _s = this, _e = this.config.elem, $c = $(_e).next(), _cls = sys.class, $dd = $c.find(`.${_cls.dropdown}`);

    if ($c.find(`.${_cls.inputBox}`).hasClass('focus')) {
      return _s.onClose.bind(_s)(e);
    }

    if (document.body.offsetHeight- e.clientY < 300 && e.clientY > 300) {
      $c.addClass(_cls.selectup);
    }

    $c.find(`.${_cls.inputBox}`).addClass('focus');
  }

  Cascader.prototype.onClose = function (e) {
    var _e = this.config.elem, $c = $(_e).next(), _cls = sys.class;

    $c.removeClass(_cls.selectup);
    $c.find(`.${_cls.inputBox}`).removeClass('focus');
  }

  e(mod, {
    render (opts) {
      if (opts.elem === undefined) {
        return console.error(mod, 'elem is undefined');
      } else if (typeof opts.elem !== 'object' || !(opts.elem instanceof HTMLElement)) {
        return console.error(mod, 'elem is not HTMLElement');
      }
      return new Cascader(opts);
    }
  });
});