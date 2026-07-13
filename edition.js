/*
Fōrmulæ programming package. Module for edition.
Copyright (C) 2015-2026 Laurence R. Ugalde

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

"use strict";

export class Programming extends Formulae.Package {}

Programming.blockExpandCollapseAction = {
	isAvailableNow: () => true,
	getDescription: () => Programming.messages.actionExpandCollapseBlock,
	doAction: () => {
		Formulae.sExpression.expanded = !Formulae.sExpression.expanded;
		
		Formulae.sHandler.prepareDisplay();
		Formulae.sHandler.display();
		Formulae.setSelected(Formulae.sHandler, Formulae.sExpression, false);
	}
};

Programming.blockDescriptionAction = {
	isAvailableNow: () => Formulae.sHandler.type != Formulae.ROW_OUTPUT,
	getDescription: () => Programming.messages.actionChangeBlockDescription,
	doAction: () => {
		let s = Formulae.sExpression.get("Description");
		do {
			s = prompt("Change description", s);
		}
		while (s == "");
		
		if (s == null) return;
		
		Formulae.sExpression.set("Description", s);
		
		Formulae.sHandler.prepareDisplay();
		Formulae.sHandler.display();
		Formulae.setSelected(Formulae.sHandler, Formulae.sExpression, false);
	}
};

Programming.setEditions = function() {
	// Block (wrapper) — Programming.Block requires its Description/Expanded serialized
	// attributes (setSerializationStrings reads strings[0].length), so it can't use
	// addWrapperEditions, whose attribute-less XML would deserialize to null → crash.
	Formulae.addEdition(
		this.messages.pathProgramming,
		'<expression tag="Programming.Block" Description="x" Expanded="True"><expression tag="Visualization.Selected"><expression tag="Null"/></expression></expression>',
		this.messages.leafBlock,
		() => Expression.wrapperEdition("Programming.Block")
	);

	// Conditionals
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.If",          2), this.messages.leafIfThen,      () => Expression.multipleEdition("Programming.If",          2, 0));
	Formulae.addBinaryEdition(this.messages, "Programming", "InvertedIf", "Programming.InvertedIf");
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.IfElse",      3), this.messages.leafIfThenElse,  () => Expression.multipleEdition("Programming.IfElse",      3, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.Conditional", 3), this.messages.leafConditional, () => Expression.multipleEdition("Programming.Conditional", 3, 0));

	// Switches
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.ConditionalSwitch", 2), this.messages.leafConditionalSwitch, () => Expression.multipleEdition("Programming.ConditionalSwitch", 2, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.ComparativeSwitch", 3), this.messages.leafComparativeSwitch, () => Expression.multipleEdition("Programming.ComparativeSwitch", 3, 0));

	// For loops
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.ForTimes",  2), this.messages.leafForTimes,  () => Expression.multipleEdition("Programming.ForTimes",  2, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.ForFromTo", 4), this.messages.leafForFromTo, () => Expression.multipleEdition("Programming.ForFromTo", 4, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.ForIn",     3), this.messages.leafForIn,     () => Expression.multipleEdition("Programming.ForIn",     3, 0));

	// Inverted for loops
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.InvertedForTimes",  2), this.messages.leafInvertedForTimes,  () => Expression.multipleEdition("Programming.InvertedForTimes",  2, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.InvertedForFromTo", 4), this.messages.leafInvertedForFromTo, () => Expression.multipleEdition("Programming.InvertedForFromTo", 4, 0));
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.InvertedForIn",     3), this.messages.leafInvertedForIn,     () => Expression.multipleEdition("Programming.InvertedForIn",     3, 0));

	// Cycle (⟳) — SummationLikeSymbol; replaces the former cycle*.png icons. type 4 = range, 3 = list, 2 = times
	Formulae.addEdition(this.messages.pathProgrammingCycle, Formulae.icon("Programming.Cycle", 4), this.messages.leafCycleFromTo, () => Expression.multipleEdition("Programming.Cycle", 4, 0));
	Formulae.addEdition(this.messages.pathProgrammingCycle, Formulae.icon("Programming.Cycle", 3), this.messages.leafCycleIn,     () => Expression.multipleEdition("Programming.Cycle", 3, 0));
	Formulae.addEdition(this.messages.pathProgrammingCycle, Formulae.icon("Programming.Cycle", 2), this.messages.leafCycleTimes,  () => Expression.multipleEdition("Programming.Cycle", 2, 0));

	// While / until
	Formulae.addEdition(this.messages.pathProgramming, Formulae.icon("Programming.While", 2), this.messages.leafWhile, () => Expression.multipleEdition("Programming.While", 2, 0));
	Formulae.addBinaryEdition(this.messages, "Programming", "Until", "Programming.Until");

	/*
	Formulae.addEdition(this.messages.pathProgramming, null, "GetLineIterator", () => Expression.wrapperEdition ("Programming.GetLineIterator"));
	Formulae.addEdition(this.messages.pathProgramming, null, "GetNext",         () => Expression.wrapperEdition ("Programming.GetNext"));
	*/
};

Programming.setActions = function() {
	Formulae.addAction("Programming.Block", Programming.blockExpandCollapseAction);
	Formulae.addAction("Programming.Block", Programming.blockDescriptionAction);
};
