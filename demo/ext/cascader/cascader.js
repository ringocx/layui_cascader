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
      tagBody: 'cascader-tags-body',
      tagItem: 'cascader-tags-item',
      tagNum: 'cascader-tags-num',
      dropdown: 'cascader-dropdown',
      dropdownPanel: 'cascader-dropdown-panel',
      dropdownDl: 'cascader-dropdown-dl',
      dropdownDd: 'cascader-dropdown-dd',
      selectup: 'layui-selectup'
    },
    template: {
      main: '<div class="{{d.cls.container}}"><div class="{{d.cls.inputBox}} cascader-input--suffix"><input type="text" readonly placeholder="{{d.opts.placeholder}}" class="{{d.cls.input}} layui-input" /><span class="{{d.cls.inputSuffix}}"><i class="layui-icon layui-icon-triangle-d"></i></span></div><div class="{{d.cls.dropdown}} layui-anim layui-anim-upbit"><div class="{{d.cls.dropdownPanel}}"></div></div>{{# if (d.opts.multiple) { }}<div class="{{d.cls.tags}}"><div class="{{d.cls.tagBody}}"></div></div>{{# } }}</div>',
      dropdownDl: '<div class="{{d.cls.dropdownDl}}">{{# layui.each(d.list, function(i, e){ }}<div class="{{d.cls.dropdownDd}}" data-v="{{e.value}}"><span>{{e.label}}</span>{{# if (e.hasChildren) { }}<i class="layui-icon layui-icon-right"></i>{{# } }}<i class="layui-icon layui-icon-ok"></i></div>{{# }); }}</div>',
      tags: '{{# layui.each(d.list, function (i, e) { }}<div class="{{d.cls.tagItem}}" data-v="{{e.value}}"><span>{{ e.label }}</span><i class="layui-icon layui-icon-close-fill"></i></div>{{# }); }}',
      tagsCollapse: '<div class="{{d.cls.tagItem}}" data-v="{{d.list[0].value}}"><span>{{d.list[0].label}}</span><i class="layui-icon layui-icon-close-fill"></i></div><div class="{{d.cls.tagItem}} {{d.cls.tagNum}}">+{{d.list.length}}</div>'
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
    collapseTags: true,
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
    $(_e).parent().find(`.${sys.class.container}`).remove(), $(_e).hide().after(tpl(sys.template.main).render({ cls: sys.class, opts: _s.config }));
    _s.renderData([]), _s.eventRegister(), _s.showLabel();
  }

  Cascader.prototype.eventRegister = function () {
    var _s = this, _e = _s.config.elem, _cls = sys.class, $c = $(_e).next();

    $c.find(`.${_cls.inputBox}`).on('click', _s.onShow.bind(_s));

    $c.find(`.${_cls.tags}`).on('click', _s.onShow.bind(_s));

    $c.find(`.${_cls.tags}`).on('click', `.${_cls.tagItem} > i`, function (e) { e.stopPropagation(); _s.onSelect.bind(_s)($(this).closest(`.${_cls.tagItem}`).data('v')); });

    $c.on('click', `.${_cls.dropdownDd}`, function (e) { e.stopPropagation(); _s.onSelect.bind(_s)($(this).data('v'))});

    $(document).on('click', function (e) {
      var _target = e.target, _item = $c.find(_target);
      if ($c.find(_target).length === 0) {
        _s.onClose.bind(_s)(e);
      }
    });
  }

  Cascader.prototype.renderData = function (treePath) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $dp = $c.find(`.${_cls.dropdownPanel}`), _options = _s.config.options;
    if (treePath.length > 0) {
      _options = _s.getChildren(treePath);
    }

    $dp.find(`.${_cls.dropdownDl}`).each(function (i, e) {
      if (i >= treePath.length) {
        $(e).remove();
      }
    });
    
    if (_options.length === 0) {
      return;
    }

    var _$ddList = $(tpl(sys.template.dropdownDl).render({ list: _options.map(function (e, i) {
      return { 
        label: e[_s.config.props.label],
        value: treePath.concat([e[_s.config.props.value]]).join(_s.config.valueSeparator),
        hasChildren: e[_s.config.props.children] === undefined ? false : e[_s.config.props.children].length > 0
      }
    }), cls: sys.class }));
    _$ddList.appendTo($dp);

    _s.highlight();
  }

  Cascader.prototype.onSelect = function (v) {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $dp = $c.find(`.${_cls.dropdownPanel}`);
    var _v = _s.getSelectedValue(), _treePath = (`${v}`.split(_s.config.valueSeparator));

    if (_s.getChildren(_treePath).length > 0) {
      selected = _treePath;
      _s.renderData(_treePath);
      _s.highlight();
      return;
    }

    if (_s.config.multiple) {
      var _item = _s.getItemByPath(_treePath), _value = _s.convertValue(_item)
      var _i = _v.indexOf(_value);
      if (_i >= 0) {
        _v.splice(_i, 1)
      } else {
        _v = _v.concat(_value);
      }
      $(_e).val(_v.join(_s.config.groupSeparator));
      _s.showLabel();
    } else {
      $(_e).val(_s.convertValue(_s.getItemByPath(_treePath)));
      _s.showLabel(), _s.onClose();
    }

    _s.highlight();
  }

  Cascader.prototype.showLabel = function () {
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $tags = $c.find(`.${_cls.tags}`);

    var _selectedOptions = _s.getSelectOptions();

    if (_s.config.multiple) {
      var $input = $c.find(`.${_cls.input}`), $tagBody = $tags.find(`.${_cls.tagBody}`), _labels = _selectedOptions.map(function (e) { return { label: _s.convertInputText(e), value: _s.convertValue(e) }; });
      if (_labels.length === 0) {
        $input.attr('placeholder', _s.config.placeholder), $input.height('')
        $tags.hide();
        return;
      }
      tpl(_s.config.collapseTags ? sys.template.tagsCollapse : sys.template.tags).render({ cls: sys.class, list: _labels }, function (html) {
        $tagBody.html(html);
        setTimeout(function () {
          $input.attr('placeholder', ''), $input.height($tags.height() + 2), $tags.show();
        }, 300);
      });
    } else {
      $c.find(`.${_cls.input}`).val(_s.convertInputText(_selectedOptions ? _selectedOptions[0] : null));
    }
  }

  Cascader.prototype.getChildren = function (path) {
    var _s = this;

    if (!Array.isArray(path)) {
      path = path.split(_s.config.valueSeparator);
    }

    return path.reduce(function (res, e) { 
      var _selected = res.filter(function (_e, _i) {
        return _e[_s.config.props.value].toString() === e.toString();
      });
      _selected = _selected.length > 0 ? _selected[0] : {};
      return _selected.hasOwnProperty(_s.config.props.children) ? _selected[_s.config.props.children] : []; 
    }, _s.config.options)
  }

  Cascader.prototype.getItemByPath = function (path) {
    var _s = this, _options = _s.config.options;

    if (!Array.isArray(path)) {
      path = path.split(_s.config.valueSeparator);
    }

    return path.reduce(function (res, e) {
      var restruct = _options.filter(function (_e) {
        return _e[_s.config.props.value].toString() === e.toString()
      })
      if (restruct.length > 0) {
        res.push(restruct[0]);
        _options = restruct[0][_s.config.props.children] !== undefined ? restruct[0][_s.config.props.children] : [];
      }
      return res
    }, [])
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
    _v = _v.concat(selected.join(_s.config.valueSeparator)).reduce(function (res, e) {
      return _marginObject(e.split(_s.config.valueSeparator), res);
    }, {});
    
    $dp.find(`.${_cls.dropdownDd}`).removeClass('selected in-active');
    $dp.find(`.${_cls.dropdownDl}`).each(function (i, e) {
      if (_v === undefined) { return; }
      var _keys = Object.keys(_v);
      if (_keys.length > 0) {
        _keys.forEach(function (_e) {
          var _key = selected.slice(0, i).concat(_e).join(_s.config.valueSeparator);
          $(e).find(`.${_cls.dropdownDd}[data-v="${_key}"]`).addClass(_s.getChildren(_key).length > 0 ? (_s.config.multiple ? 'in-active' : '') : 'selected')
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
    var value = $(_e).val() === "" 
      ? []
      : $(_e).val().split(_s.config.groupSeparator)
    return Array.isArray(value) ? value : [value];
  }

  Cascader.prototype.convertInputText = function (v) {
    if (!v) {
      return '';
    }
    var _s = this, _e = this.config.elem, _cls = sys.class, $c = $(_e).next(), $input = $c.find(`.${_cls.input}`);
    return _s.config.showAllLevels 
      ? v.map(function (e) { return e[_s.config.props.label]; }).join(` ${_s.config.separator} `)
      : v[v.length - 1][_s.config.props.label];
  }

  Cascader.prototype.convertValue = function (v) {
    var _s = this;
    if (!Array.isArray(v)) {
      v = [v];
    }
    return v.map(function (e) { return e[_s.config.props.value]; }).join(_s.config.valueSeparator)
  }

  Cascader.prototype.onShow = function (e) {
    var _s = this, _e = this.config.elem, $c = $(_e).next(), _cls = sys.class, $input = $c.find(`.${_cls.input}`);

    if ($c.find(`.${_cls.inputBox}`).hasClass('focus')) {
      return _s.onClose.bind(_s)(e);
    }

    if (document.body.offsetHeight - ($input.offset().top + $input.height()) < 300 && $input.offset().top > 300) {
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

  layui.link(layui.cache.base + 'cascader/cascader.css')
});