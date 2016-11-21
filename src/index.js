var react = require("react");
var reactDom = require("react-dom/server");
var Select = require("react-select");
require("babel-polyfill");

class A extends react.Component{
	constructor(props,context){
		super(props,context);
	}
	async initialize(){
		await new Promise(function(s){
			setTimeout(()=>s());
		});
	}
	render(){
		return react.createElement("div",{},
			react.createElement("h1"),
			react.createElement(B)/*,
			react.createElement(C,{},
				react.createElement(B)
			),
			["a","b"]*/
		)
	}

	getChildContext(){
		return {text:"Hello world!"}
	}
}

A.childContextTypes = {
	text: react.PropTypes.string
}

class B extends react.Component{
	render(){
		return react.createElement("div",{},this.context.text);
	}
}

B.contextTypes = {
	text: react.PropTypes.string
}

class C extends react.Component{
	render(){
		return react.createElement.apply(react,["div",{}].concat(this.props.children));
	}
}

class Wrapper extends react.Component{
	render(){
		return this.props.children;
	}
}

async function renderAsync(element,context){
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

(async function(){
	try{
		var elem = react.createElement(Select,{options:[{value:"one",label:"on"}],value:"one"});
		var tree = await renderAsync(elem);
		//console.log(JSON.stringify(getTree(tree),null,"\t"));
		//console.log(JSON.stringify(getTree(elem),null,"\t"));
		console.log(reactDom.renderToString(tree));
		console.log(reactDom.renderToString(elem));
	}catch(e){
		console.log(e.message,e.stack)
	}
})();

function getTree(element,context){
	var context = context||{};
	if(typeof element == "string") return element;
	var node = {type:element.type};
	if(node.type instanceof Function){
		node.type = node.type.name;
		var instance = new (element.type)(element.props,context);
		element = instance.render();
		if(instance.getChildContext) context = Object.assign({},context,instance.getChildContext());
		node.children = getTree(element,context);
	}else if(typeof node.type == "string"){
		if(element.props.children){
			node.children=(element.props.children instanceof Array?element.props.children:[element.props.children]).map(e=>getTree(e,context))
		}
	}
	return node;
}
