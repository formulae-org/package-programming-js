/*
Fōrmulæ programming package. Module for reduction.
Copyright (C) 2015-2025 Laurence R. Ugalde

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

'use strict';

export class Programming extends Formulae.Package {}

Programming.blockReducer = async (block, session) => {
	block.replaceBy(block.children[block.children.length - 1]);
	return true;
};

Programming.ifReducer = async (expr, session) => {
	let condition = await session.reduceAndGet(expr.children[0], 0);
	
	switch (condition.getTag()) {
		case "Logic.True": {
			let body; 
			expr.replaceBy(body = expr.children[1]);
			await session.reduce(body);
			return true;
		}
		
		case "Logic.False": {
			expr.replaceBy(Formulae.createExpression("Null"));
			return true;
		}
		
		default: {
			ReductionManager.setInError(condition, "Expression is not a boolean expression");
			throw new ReductionError();
		}
	}
};

Programming.invertedIfReducer = async (expr, session) => {
	let condition = await session.reduceAndGet(expr.children[1], 1);
	
	switch (condition.getTag()) {
		case "Logic.True": {
			let body; 
			expr.replaceBy(body = expr.children[0]);
			await session.reduce(body);
			return true;
		}
		
		case "Logic.False": {
			expr.replaceBy(Formulae.createExpression("Null"));
			return true;
		}
		
		default: {
			ReductionManager.setInError(condition, "Expression is not a boolean expression");
			throw new ReductionError();
		}
	}
};

Programming.ifElseReducer = async (expr, session) => {
	let condition = await session.reduceAndGet(expr.children[0], 0);
	
	switch (condition.getTag()) {
		case "Logic.True": {
			let left;
			expr.replaceBy(left = expr.children[1]);
			await session.reduce(left);
			return true;
		}
		
		case "Logic.False": {
			let right;
			expr.replaceBy(right = expr.children[2]);
			await session.reduce(right);
			return true;
		}
		
		default: {
			ReductionManager.setInError(condition, "Expression is not a boolean expression");
			throw new ReductionError();
		}
	}
};

Programming.forTimesReducer = async (_for, session) => {
	// reducing the number
	let numberExpression = await session.reduceAndGet(_for.children[1], 1);
	
	let n = Arithmetic.getNativeInteger(numberExpression);
	if (n === undefined || n < 0) {
		ReductionManager.setInError(numberExpression, "Invalid number");
		throw new ReductionError();
	}
	
	// backing up the body
	let body = _for.children[0];
	
	// iterating n times
	for (let i = 0; i < n; ++i) {
		_for.setChild(0, body.clone());
		await session.reduce(_for.children[0]);
	}
	
	_for.replaceBy(Formulae.createExpression("Null"));
	return true;
};

Programming.forFromToReducer = async (_for, session) => {
	let n = _for.children.length;
	
	let symbol = _for.children[1];
	if (symbol.getTag() !== "Symbolic.Symbol") {
		ReductionManager.setInError(symbol, "Expression must be a symbol");
		throw new ReductionError();
	}
	
	// reducing all children excepting the first one (body) and second one (symbol)
	for (let i = 2; i < n; ++i) {
		await session.reduce(_for.children[i]);
	}
	
	// backing up the body
	let body = _for.children[0];
	
	// from
	if (!_for.children[2].isInternalNumber()) {
		ReductionManager.setInError(_for.children[2], "Expression must be numeric");
		throw new ReductionError();
	}
	let from = _for.children[2].get("Value");
	
	// to
	if (!_for.children[3].isInternalNumber()) {
		ReductionManager.setInError(_for.children[3], "Expression must be numeric");
		throw new ReductionError();
	}
	let to = _for.children[3].get("Value");
	
	// step
	let step;
	if (n == 5) {
		if (!_for.children[4].isInternalNumber()) {
			ReductionManager.setInError(_for.children[4], "Expression must be numeric");
			throw new ReductionError();
		}
		step = _for.children[4].get("Value");
	} else {
		step = Arithmetic.getIntegerOne(session);;
	}
	
	// sign
	let negative = step.isNegative();
	
	/////////////////////////
	
	_for.createScope();
	let scopeEntry = new ScopeEntry();
	_for.putIntoScope(symbol.get("Name"), scopeEntry, false);
	
	iterating: while (true) {
		if (negative) {
			if (Arithmetic.comparison(from, to, session) < 0) {
				break iterating;
			}
		}
		else {
			if (Arithmetic.comparison(from, to, session) > 0) {
				break iterating;
			}
		}
		
		scopeEntry.setValue(
			Arithmetic.createInternalNumber(from, session)
		);
		
		_for.setChild(0, body.clone());
		await session.reduce(_for.children[0]);
		
		// step
		from = Arithmetic.addition(from, step, session);
	}
	
	_for.replaceBy(_for.children[0]);
	return true;
};

Programming.forInReducer = async (_for, session) => {
	// the symbol
	let symbol = _for.children[1];
	if (symbol.getTag() !== "Symbolic.Symbol") {
		ReductionManager.setInError(symbol, "Expression must be a symbol");
		throw new ReductionError();
	}
	
	// reducing the list
	let list = await session.reduceAndGet(_for.children[2], 2);
	if (list.getTag() !== "List.List") {
		ReductionManager.setInError(list, "Expression must be a list");
		throw new ReductionError();
	}
	
	// backing up the body
	let body = _for.children[0];
	
	////////////////////////////////

	_for.createScope();
	let scopeEntry = new ScopeEntry();
	_for.putIntoScope(symbol.get("Name"), scopeEntry, false);

	for (let i = 0, m = list.children.length; i < m; ++i) {
		scopeEntry.setValue(list.children[i].clone());
		
		// for iteration
		
		_for.setChild(0, body.clone());
		await session.reduce(_for.children[0]);
	}
	
	_for.replaceBy(_for.children[0]);
	return true;
};

Programming.cycle = async (cycle, session) => {
	switch (cycle.children.length) {
		case 2: // times
			return await Programming.forTimesReducer(cycle, session);
		
		case 3: // in
			return await Programming.forInReducer(cycle, session);
		
		case 4: // from-to
		case 5: // from-to-step 
			return await Programming.forFromToReducer(cycle, session);
	}
}

Programming.whileReducer = async (whileExpr, session) => {
	let copy = whileExpr.clone(), copyCopy;
	let result = null;
	
	loop: while (true) {
		await session.reduce(whileExpr.children[0]);
		
		switch (whileExpr.children[0].getTag()) {
			case "Logic.True": {
				await session.reduce(whileExpr.children[1]);
				result = whileExpr.children[1];
				
				copyCopy = copy.clone();
				whileExpr.replaceBy(copyCopy);
				whileExpr = copyCopy;
				continue loop;
			}
			
			case "Logic.False": {
				break loop;
			}
			
			default: {
				ReductionManager.setInError(whileExpr.children[0], "It is not a boolean expression");
				throw new ReductionError();
			}
		}
	}
	
	if (result == null) {
		result = Formulae.createExpression("Null");
		whileExpr.replaceBy(result);
	}
	
	return true;
};

Programming.untilReducer = async (until, session) => {
	let copy = until.clone(), copyCopy;
	
	loop: while (true) {
		await session.reduce(until.children[0]);
		await session.reduce(until.children[1]);
		
		switch (until.children[1].getTag()) {
			case "Logic.True": {
				break loop;
			}
			
			case "Logic.False": {
				copyCopy = copy.clone();
				until.replaceBy(copyCopy);
				until = copyCopy;
				continue loop;
			}
			
			default: {
				ReductionManager.setInError(until.children[1], "It is not a boolean expression");
				throw new ReductionError();
			}
		}
	}
	
	until.replaceBy(until.children[0]);
	return true;
};

Programming.comparativeSwitch = async (_switch, session) => {
	let comparand = await session.reduceAndGet(_switch.children[0], 0);
	
	let cases = Math.floor((_switch.children.length - 1) / 2);
	let other;
	let isList;
	let otherTag;
	let tmpExpr;
	
	// cases
	
	for (let c = 0; c < cases; ++c) {
		other = await session.reduceAndGet(_switch.children[2 * c + 1], 2 * c + 1);
		isList = other.getTag() === "List.List";
		
		tmpExpr = Formulae.createExpression(isList ? "Relation.In" : "Relation.Compare");
		tmpExpr.addChild(comparand.clone());
		tmpExpr.addChild(other);
		
		_switch.setChild(
			2 * c + 1,
			tmpExpr
		);
		
		other = await session.reduceAndGet(_switch.children[2 * c + 1], 2 * c + 1);
		otherTag = other.getTag();
		
		if (
			(!isList && otherTag === "Relation.Comparison.Equals") ||
			(isList && otherTag === "Logic.True")
		) {
			let result;
			_switch.replaceBy(result = _switch.children[2 * c + 2]);
			await session.reduce(result);
			return true;
		}
	}
	
	// else (if any)
	
	if ((_switch.children.length % 2) == 0) {
		let result;
		_switch.replaceBy(result = _switch.children[_switch.children.length - 1]);
		await session.reduce(result);
		return true;
	}
	
	// reduce to null
	
	_switch.replaceBy(Formulae.createExpression("Null"));
	return true;
};

Programming.conditionalSwitch = async (_switch, session) => {
	let cases = Math.floor(_switch.children.length / 2);
	let other;
	let otherTag;
	
	for (let c = 0; c < cases; ++c) {
		other = await session.reduceAndGet(_switch.children[2 * c], 2 * c);
		otherTag = other.getTag();
		
		if (otherTag === "Logic.True") {
			let result;
			_switch.replaceBy(result = _switch.children[2 * c + 1]);
			await session.reduce(result);
			return true;
		}
	}
	
	// else (if any)
	
	if ((_switch.children.length % 2) != 0) {
		let result;
		_switch.replaceBy(result = _switch.children[_switch.children.length - 1]);
		await session.reduce(result);
		return true;
	}
	
	// reduce to null
	
	_switch.replaceBy(Formulae.createExpression("Null"));
	return true;
};

Programming.setReducers = () => {
	ReductionManager.addReducer("Programming.Block", Programming.blockReducer, "Programming.blockReducer");
	
	ReductionManager.addReducer("Programming.If",          Programming.ifReducer,         "Programming.ifReducer",         { special: true });
	ReductionManager.addReducer("Programming.InvertedIf",  Programming.invertedIfReducer, "Programming.invertedIfReducer", { special: true });
	ReductionManager.addReducer("Programming.IfElse",      Programming.ifElseReducer,     "Programming.ifElseReducer",     { special: true });
	ReductionManager.addReducer("Programming.Conditional", Programming.ifElseReducer,     "Programming.ifElseReducer",     { special: true });
	
	ReductionManager.addReducer("Programming.ForTimes",  Programming.forTimesReducer,  "Programming.forTimesReducer",  { special: true });
	ReductionManager.addReducer("Programming.ForFromTo", Programming.forFromToReducer, "Programming.forFromToReducer", { special: true });
	ReductionManager.addReducer("Programming.ForIn",     Programming.forInReducer,     "Programming.forInReducer",     { special: true });
	
	ReductionManager.addReducer("Programming.Cycle",  Programming.cycle, "Programming.cycle", { special: true });
	
	ReductionManager.addReducer("Programming.While", Programming.whileReducer, "Programming.whileReducer", { special: true });
	ReductionManager.addReducer("Programming.Until", Programming.untilReducer, "Programming.untilReducer", { special: true });
	
	ReductionManager.addReducer("Programming.ComparativeSwitch", Programming.comparativeSwitch, "Programming.comparativeSwitch", { special: true });
	ReductionManager.addReducer("Programming.ConditionalSwitch", Programming.conditionalSwitch, "Programming.conditionalSwitch", { special: true });
};

