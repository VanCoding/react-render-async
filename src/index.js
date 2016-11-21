var react = require("react");
var reactDom = require("react-dom/server");
require("babel-polyfill");

module.exports = async function renderAsync(element,context){
	context = context||{};
	if(!element) return element;
	if(element.type instanceof Function){
		var defaultProps = element.type.getDefaultProps?element.type.getDefaultProps():{};
		if(element.type.getDefaultProps) console.log("has default props");
		var instance = new (element.type)(Object.assign({},defaultProps,element.props),context);
		if(instance.initialize) await instance.initialize();
		if(instance.componentWillMount)instance.componentWillMount();
		element = instance.render();
		if(instance.getChildContext) context = Object.assign({},context,instance.getChildContext());
		element = await renderAsync(element,context);
		element = react.createElement(Wrapper,{},element);
	}else if(typeof element.type == "string"){
		if(element.props.children){
			var children = element.props.children instanceof Array?element.props.children:[element.props.children];
			var props = Object.assign({},element.props,{children:[]});
			await Promise.all(children.map(async function(child,i){
				props.children[i] = await renderAsync(children[i],context);
			}))
			if(props.children.length === 1) props.children = props.children[0];
			element = react.cloneElement(element,props);
		}
	}else if(element instanceof Array){
		var elements = [];
		for(var e in element){
			elements.push(await renderAsync(e,context));
		}
		element = elements;
	}
	return element;
}
