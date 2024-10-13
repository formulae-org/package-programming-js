/*
Fōrmulæ programming package. Module for edition.
Copyright (C) 2015-2023 Laurence R. Ugalde

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

Programming.blockExpandCollapseAction = {
	isAvailableNow: () => true,
	getDescription: () => "Expand/collapse block",
	doAction: () => {
		Formulae.sExpression.expanded = !Formulae.sExpression.expanded;
		
		Formulae.sHandler.prepareDisplay();
		Formulae.sHandler.display();
		Formulae.setSelected(Formulae.sHandler, Formulae.sExpression, false);
	}
};

Programming.blockDescriptionAction = {
	isAvailableNow: () => Formulae.sHandler.type != Formulae.ROW_OUTPUT,
	getDescription: () => "Change the description of the block...",
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
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafBlock, () => Expression.wrapperEdition ("Programming.Block"));

	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafIfThen,            () => Expression.multipleEdition("Programming.If",          2, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafInvertedIf,        () => Expression.binaryEdition  ("Programming.InvertedIf",  false));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafIfThenElse,        () => Expression.multipleEdition("Programming.IfElse",      3, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafConditional,       () => Expression.multipleEdition("Programming.Conditional", 3, 0));
	
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafConditionalSwitch, () => Expression.multipleEdition("Programming.ConditionalSwitch", 2, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafComparativeSwitch, () => Expression.multipleEdition("Programming.ComparativeSwitch", 3, 0));

	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafForTimes,  () => Expression.multipleEdition("Programming.ForTimes",  2, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafForFromTo, () => Expression.multipleEdition("Programming.ForFromTo", 4, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafForIn,     () => Expression.multipleEdition("Programming.ForIn",     3, 0));
	
	Formulae.addEdition(this.messages.pathProgrammingCycle, "packages/org.formulae.programming/img/cycle4.png", null, () => Expression.multipleEdition("Programming.CycleFromTo", 4, 0));
	Formulae.addEdition(this.messages.pathProgrammingCycle, "packages/org.formulae.programming/img/cycle3.png", null, () => Expression.multipleEdition("Programming.CycleIn",     3, 0));
	Formulae.addEdition(this.messages.pathProgrammingCycle, "packages/org.formulae.programming/img/cycle2.png", null, () => Expression.multipleEdition("Programming.CycleTimes",  2, 0));
	
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafWhile,     () => Expression.multipleEdition("Programming.While", 2, 0));
	Formulae.addEdition(this.messages.pathProgramming, null, this.messages.leafUntil,     () => Expression.binaryEdition  ("Programming.Until", false));
};

Programming.setActions = function() {
	Formulae.addAction("Programming.Block", Programming.blockExpandCollapseAction);
	Formulae.addAction("Programming.Block", Programming.blockDescriptionAction);
};
