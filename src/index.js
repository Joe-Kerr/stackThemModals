const modalStack = [];

function isClickOnOrInsideModal(modalEl, clickTarget) {
	let node = clickTarget;
	while(node != null) {
		//console.log("comparing parent", modalEl, "to child", node);
		if(node == modalEl) {
			return true;
		}			
		node = node.parentNode;
	}	
	return false;
}

function modalListenerCallback(event, index=-2) {
	
	if(index === -2) {
		index = modalStack.length - 1;
	}
	else if(index === -1) {
		return;
		throw new Error("Function should have finished at index 0. Got to -1.");
	}
	
	//const index = modalStack.length - 1;
	
	const modalEl =  modalStack[index].element;
	
	if(isClickOnOrInsideModal(modalEl, event.target)) {
		modalListenerCallback(event, index-1);
		return;		
	}
	
	if(modalStack[index].stop === true) {
		event.stopPropagation();
	}
	
	modalStack[index].callback();
	//modalStack.pop();
	modalStack.splice(index,1);
	
	if(modalStack.length === 0) {
		cleanup();
	}
	else if(index > 0) {
		modalListenerCallback(event, index-1);
	}
}

function cleanup() {
	document.removeEventListener("mousedown", modalListenerCallback, true);
}

function enable(element, callback, config={}) {	
	if(typeof element === "function") {
		throw new Error("DEPRECATED: do not enable the modalStack with a getter function to the dom node.");
	}	
	
	config.stopPropagation = (typeof config.stopPropagation === "boolean") ? config.stopPropagation : true;
	
	modalStack.push({element, callback, stop: config.stopPropagation});
	
	if(modalStack.length === 1)
		document.addEventListener("mousedown", modalListenerCallback, {capture: true});
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

//export default {enable, cancel};


export default {
	push: enable,
	forcePop: cancel
}
