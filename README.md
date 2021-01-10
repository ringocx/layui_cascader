# layui_cascader
基于LayUI的级联选择器Cascader

## 效果图

### 单选
 ![image](https://github.com/ringocx/layui_cascader/blob/master/mini2.gif)

### 多选（选项无折叠）
 ![image](https://github.com/ringocx/layui_cascader/blob/master/mini.gif)

### 多选（选项折叠）
 ![image](https://github.com/ringocx/layui_cascader/blob/master/mini1.gif)
  
## 配置参数文档（*表示必填）
*elem：HTMLElement对象，例如：$('input[name=example]')[0]  
*options：Array 数据  
onChange: Function(curr, value) curr: 选中值，value：所有值(当multiple为true有效)
multiple：boolean 是否开启多选，默认 Flase  
collapseTags：boolean 是否折叠选项（multiple 开启时有效），默认 True  
showAllLevels: boolean 是否查看所有级名，默认 True  
props：数据对象解析，默认：{ label: 'label', value: 'value', children: 'children' }  
placeholder：String 无选择文本填充 默认 请选择  
separator：String 显示文本的分隔符号（showAllLevels开启时生效） 默认 /  
valueSeparator：String 选择值的级联分隔符号 默认 ,  
groupSeparator：String 多选时选择值的组分隔符号 默认 |  
