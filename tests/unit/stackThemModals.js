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
<div id="test4" class="test" style="top: -5px; left: -10px;">test4</div>
<div id="test3" class="test" style="top: 10px; left: 50px;">test3</div>
<div id="test2" class="test" style="top: 25px; left: 110px;">test2
	<div id="test2sChild1"></div>
	<div id="test2sChild2"></div>
</div>
<div id="test1" class="test" style="top: 40px; left: 170px;">test1</div>
<div id="test0" class="test" style="top: 55px; left: 260px;">test0</div>
</body>
</html>
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

test("push throws if element parameter is not an HTML element.", ()=>{
	const modal = document.getElementById("test3");
	assert.doesNotThrow(()=>{ sample.push(modal, ()=>{}); });
	
	const bollocks = {id: "trustMeImAHTMLElement", className: "noReally!"};
	assert.throws(()=>{ sample.push(bollocks, ()=>{}) }, {message: /is not an HTML element/});
	
	sample.forcePop(true);
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
	const modal = document.getElementById("test2");
	const child1 = document.getElementById("test2sChild1");
	const child2 = document.getElementById("test2sChild2");
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
	const modalB = document.getElementById("test2");
	const out = document.getElementById("test4");
	
	let callCountA = 0;
	let callCountB = 0;
	
	sample.push(modalA, ()=>{ callCountA++ });
	sample.push(modalB, ()=>{ callCountB++ });	
	
	trigger(out, "mousedown");
	
	assert.equal(callCountA, 1);
	assert.equal(callCountB, 1);	
});

test("Clicking outside element A (first modal) but within element B (second modal) only destroys modal behaviour for A.", ()=>{
	const modalA = document.getElementById("test2");
	const modalB = document.getElementById("test3");
	const out = modalB;
	let callCountA = 0;
	let callCountB = 0;
	
	sample.push(modalB, ()=>{ callCountB++ });	
	sample.push(modalA, ()=>{ callCountA++ });
	
	trigger(out, "mousedown");
	
	assert.equal(callCountA, 1);
	assert.equal(callCountB, 0);
	
	sample.forcePop(true);
});

test("User callbacks are called with click event", ()=>{
	const modal = document.getElementById("test3");
	const out = document.getElementById("test4");

	let event1 = null;
	let event2 = null;
	
	sample.push(modal, (event)=>{ event1 = event; });
	sample.push(modal, (event)=>{ event2 = event; });
	
	trigger(out, "mousedown");
	trigger(out, "mousedown");
	
	assert.equal(event1.type, "mousedown");
	assert.equal(event1.constructor.name, "Event");
	assert.equal(event2.type, "mousedown");
	assert.equal(event2.constructor.name, "Event");
});

[
	{test: "Propagation is stopped by default", cfg: {stopPropagation: undefined}, expected: 1},
	{test: "Propagation is not stopped if config provided", cfg: {stopPropagation: false}, expected: 0},
].forEach((testObj)=>{
	
	test(testObj.test, ()=>{
		const modal = document.getElementById("test3");
		const backup = document.addEventListener;
		const event = {stopPropagation: new sinon.fake()};
		
		document.addEventListener = (type, cb)=>{
			cb(event);
		}
		
		sample.push(modal, ()=>{}, testObj.cfg);	
		trigger(modal, "mousedown");	
		
		assert.equal(event.stopPropagation.callCount, testObj.expected);
		
		document.addEventListener = backup;
		document.addEventListener.resetHistory();	
		document.removeEventListener.resetHistory();		
	});
	
});