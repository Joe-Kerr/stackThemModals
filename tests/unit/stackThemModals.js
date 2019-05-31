const assert = require("assert");
const sinon = require("sinon");

const sample = require("../../src/index.js").default;

//Note that jsdom still does not do any layout or rendering (https://github.com/jsdom/jsdom#pretending-to-be-a-visual-browser)
const {JSDOM} = require("jsdom");

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="hier1">
	<li id="test5">test5</li>
	<li id="test4">
		test4
		<ul class="hier2">
			<li id="test6">test6</li>
			<li id="test3">
				test3
				<ul class="hier3">
					<li></li>
					<li id="test2">
						test2
						<ul class="hier4" id="test1"><li>test1</li></ul>
					</li>
					<li></li>
				</ul>				
			</li>
			<li></li>
		</ul>	
	</li>
	<li></li>
</ul>
</body></html>

`);

suite("stackThemModals/index.js");

function trigger(el, event) {
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent(event, false, true);
	el.dispatchEvent(evt);	
}

before(()=>{
	if(typeof global.window !== "undefined") {
		throw new Error("Test setup error: global.window already defined :o");
	}	
	
	if(typeof global.document !== "undefined") {
		throw new Error("Test setup error: global.document already defined :o");
	}
	
	//I disagree. (https://github.com/jsdom/jsdom/wiki/Don't-stuff-jsdom-globals-onto-the-Node-global)
	global.window = dom.window;
	global.document = dom.window.document;

	sinon.spy(document, "addEventListener");
	sinon.spy(document, "removeEventListener");
});

after(()=>{
	window.close();
	delete global.window;	
	delete global.document;	
});

afterEach(()=>{
	if(document.addEventListener.callCount !== document.removeEventListener.callCount) {
		throw new Error("Test setup error: listeners not properly cleaned up. Add: "+document.addEventListener.callCount+" Rem: "+document.removeEventListener.callCount);
	}
	
	document.addEventListener.resetHistory();	
	document.removeEventListener.resetHistory();
});


test("forcePop removes modal listener if no elements left.", ()=>{
	const modal = document.getElementById("test3");
	sample.push(modal, ()=>{});
	sample.forcePop();
	assert.equal(document.addEventListener.callCount, 1);
	assert.equal(document.removeEventListener.callCount, 1);	
});

test("forcePop removes last modal element on stack by default.", ()=>{
	const modal1 = document.getElementById("test1");
	const modal2 = document.getElementById("test2");
	const out = document.getElementById("test4");
	let callCount1 = 0;
	let callCount2 = 0;
	
	sample.push(modal1, ()=>{callCount1++;});	
	sample.push(modal2, ()=>{callCount2++;});	
	
	sample.forcePop();
	trigger(out, "mousedown");
	
	assert.equal(callCount1, 1);
	assert.equal(callCount2, 0);
});

test("forcePop clears stack if parameter true.", ()=>{
	const modal1 = document.getElementById("test1");
	const modal2 = document.getElementById("test2");
	const out = document.getElementById("test4");
	let callCount1 = 0;
	let callCount2 = 0;
	
	sample.push(modal1, ()=>{callCount1++;});	
	sample.push(modal2, ()=>{callCount2++;});	
	
	sample.forcePop(true);
	trigger(out, "mousedown");
	
	assert.equal(callCount1, 0);
	assert.equal(callCount2, 0);	
});

test("Only first modal elemet on stack registers listener.", ()=>{
	const modal = document.getElementById("test1");
	sample.push(modal, ()=>{});
	sample.push(modal, ()=>{});
	sample.push(modal, ()=>{});
	
	assert.equal(document.addEventListener.callCount, 1);
	sample.forcePop(true);
});

test("Clicks outside the modal element destroy the modal behaviour.", ()=>{
	const modal = document.getElementById("test3");
	const out = document.getElementById("test4");

	let callCount = 0;
	
	sample.push(modal, ()=>{ callCount++ });
	
	trigger(out, "mousedown");
	trigger(out, "mousedown");
	
	assert.equal(callCount, 1);
	assert.equal(document.addEventListener.callCount, 1);
	assert.equal(document.removeEventListener.callCount, 1);
});

test("Clicks on the modal element keep the modal behaviour alive.", ()=>{
	const modal = document.getElementById("test3");
	let callCount = 0;
	
	sample.push(modal, ()=>{ callCount++ });
	
	trigger(modal, "mousedown");
	trigger(modal, "mousedown");

	assert.equal(callCount, 0);
	assert.equal(document.addEventListener.callCount, 1);
	assert.equal(document.removeEventListener.callCount, 0);

	sample.forcePop();	
});

test("Clicks on children within the modal element keep the modal behaviour alive.", ()=>{
	const modal = document.getElementById("test3");
	const child1 = document.getElementById("test1");
	const child2 = document.getElementById("test2");
	let callCount = 0;

	sample.push(modal, ()=>{ callCount++ });
	
	trigger(child1, "mousedown");
	trigger(child1, "mousedown");	
	trigger(child2, "mousedown");
	trigger(child2, "mousedown");

	assert.equal(callCount, 0);
	assert.equal(document.addEventListener.callCount, 1);
	assert.equal(document.removeEventListener.callCount, 0);

	sample.forcePop();		
});

test("Clicks outside multiple elements destroy modal behaviour of all of them by default.", ()=>{
	const modalA = document.getElementById("test3");
	const modalB = document.getElementById("test6");
	const out = document.getElementById("test5");
	
	let callCountA = 0;
	let callCountB = 0;
	
	sample.push(modalA, ()=>{ callCountA++ });
	sample.push(modalB, ()=>{ callCountB++ });	
	
	trigger(out, "mousedown");
	
	assert.equal(callCountA, 1);
	assert.equal(callCountB, 1);	
});


test("Clicking outside element A but within element B only destroys modal behaviour for A.", ()=>{
	const modalA = document.getElementById("test2");
	const modalB = document.getElementById("test3");
	const out = modalB;
	let callCountA = 0;
	let callCountB = 0;
	
	sample.push(modalA, ()=>{ callCountA++ });
	sample.push(modalB, ()=>{ callCountB++ });
	
	trigger(out, "mousedown");
	
	assert.equal(callCountA, 1);
	assert.equal(callCountB, 0);
	
	sample.forcePop(true);
});