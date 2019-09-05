const modalStack = [];

// https://stackoverflow.com/a/384380
function isElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	);
}

function isClickOnOrInsideModal(modalEl, clickTarget) {
	let node = clickTarget;
	while(node != null) {
		//console.log({node, modalEl})
		if(node == modalEl) {
			return true;
		}			
		node = node.parentNode;
	}	
	return false;
}

function modalListenerCallback(event) {
	const index = modalStack.length - 1;
	const modalEl =  modalStack[index].element;
	
	if(isClickOnOrInsideModal(modalEl, event.target)) {
		return;		
	}
	
	if(modalStack[index].stop === true) {
		event.stopPropagation();
	}
	
	modalStack[index].callback();
	modalStack.pop();
	
	if(modalStack.length === 0) {
		cleanup();
	}
	else if(index > 0) {
		modalListenerCallback(event);
	}

}

function cleanup() {
	document.removeEventListener("mousedown", modalListenerCallback, true);
}

function enable(element, callback, config={}) {	
	if(!isElement(element)) {
		throw new Error("'element' parameter is not an HTML element.");
	}
	
	const stop = (typeof config.stopPropagation === "boolean") ? config.stopPropagation : true;
	
	modalStack.push({element, callback, stop});
	
	if(modalStack.length === 1) {
		document.addEventListener("mousedown", modalListenerCallback, {capture: true});
	}
}

function cancel(stack=false) {
	modalStack.pop();
	
	if(modalStack.length === 0) {
		cleanup();	
	}
	else if(stack) {
		modalStack.splice(0, modalStack.length);
		cleanup();
	}
}

export default {
	push: enable,
	forcePop: cancel
}
