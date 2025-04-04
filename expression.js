/*
Fōrmulæ programming package. Module for expression definition & visualization.
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

Programming.codeStyle = true;

Programming.isBlock = function(expr) {
	switch (expr.getTag()) {
		case "Null":
		case "Programming.Block":
		case "Programming.If":
		case "Programming.IfElse":
		case "Programming.ForTimes":
		case "Programming.ForFromTo":
		case "Programming.ForIn":
		case "Programming.InvertedForTimes":
		case "Programming.InvertedForFromTo":
		case "Programming.InvertedForIn":
		case "Programming.Cycle":
		case "Programming.While":
		case "Programming.Until":
		case "Programming.ConditionalSwitch":
		case "Programming.ComparativeSwitch":
			return true;
	}
	
	return false;
}

Programming.AbstractBlock = class extends Expression {
	constructor() {
		super();
		
		this.description = Programming.messages.defaultBlock;
		this.expanded = true;
	}
	
	getTag() { return "Programming.Block"; }
	getName() { return Programming.messages.nameBlock; }
	canHaveChildren(count) { return count > 0; }
	
	set(name, value) {
		switch (name) {
			case "Description" : this.description = value; return;
			case "Expanded"    : this.expanded    = value; return;
		}
		
		super.set(name, value);
	}
	
	get(name) {
		switch (name) {
			case "Description" : return this.description;
			case "Expanded"    : return this.expanded;
		}
		
		super.get(name);
	}
	
	getSerializationNames() {
		return [ "Description", "Expanded" ];
	}
	
	async getSerializationStrings() {
		return [ this.description, this.expanded ? "True" : "False" ];
	}
	
	setSerializationStrings(strings, promises) {
		if (strings[0].length == 0) {
			throw "Empty description";
		}
		
		if (strings[1] != "True" && strings[1] != "False") {
			throw "Invalid expansion state";
		}
		
		this.set("Description", strings[0]);
		this.set("Expanded",    strings[1] == "True");
	}
	
	prepareDisplayCollapsed(context) {
		this.width = 10 + Math.round(context.measureText(this.description).width) + 10;
		this.height = 10 + context.fontInfo.size + 10;
		
		this.vertBaseline = Math.round(this.width / 2);
		this.horzBaseline = Math.round(this.height / 2);
		
		let expr;
		for (let i = 0, n = this.children.length; i < n; ++i) {
			let child = this.children[i];
			child.x = child.y = Number.MIN_SAFE_INTEGER;
		}
	}
	
	displayCollapsed(context, x, y) {
		let bkpFillStyle = context.fillStyle;
		context.fillStyle = "orange";
		context.fillRect(x, y, this.width, this.height);
		context.fillStyle = bkpFillStyle;
		
		context.strokeRect(x + 0.5, y + 0.5, this.width - 1, this.height - 1);
		super.drawText(context, this.description, x + 10, y + 10 + context.fontInfo.size);
	}
	
	moveAcross(son, direction) {
		if (direction == Expression.UP) {
			if (son != 0) {
				return this.children[son - 1].moveTo(direction);
			}
		}
		else if (direction == Expression.DOWN) {
			if (son != this.children.length - 1) {
				return this.children[son + 1].moveTo(direction);
			}
		}
		
		return this.moveOut(direction);
	}
	
	moveTo(direction) {
		if (!this.expanded) {
			return this;
		}
		
		if (direction == Expression.UP) {
			return this.children[this.children.length - 1].moveTo(direction);
		}
		else {
			return this.children[0].moveTo(direction);
		}
	}
	
	hasScope() {
		return true;
	}
}

Programming.CodeBlock = class extends Programming.AbstractBlock {
	prepareDisplay(context) {
		if (!this.expanded) {
			this.prepareDisplayCollapsed(context);
			return;
		}
		
		if (Programming.codeStyle) {
			this.width = 0;
			this.height = 0;
			
			let child;
			for (let i = 0, n = this.children.length; i < n; ++i) {
				(child = this.children[i]).prepareDisplay(context);
				
				if (i > 0) {
					this.height += 10;
				}
				
				child.x = 30;
				child.y = this.height;
				
				if (child.width > this.width) {
					this.width = child.width;
				}
				this.height += child.height;
			}
			
			this.width += 30;
			
			this.horzBaseline = Math.round(this.height / 2);
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchar
			let i, n = this.children.length;
			let child;
			this.width = 0;
			this.height = 10;
			
			for (let i = 0; i < n; ++i) {
				(child = this.children[i]).prepareDisplay(context);
				
				if (child.width > this.width) {
					this.width = child.width;
				}
				
				child.y = this.height;
				this.height += child.height + 10;
			}
			
			this.width += 2 * 10;
			this.vertBaseline = Math.round(this.width / 2);
			
			for (i = 0; i < n; ++i) {
				child = this.children[i];
				child.x = this.vertBaseline - Math.round(child.width / 2);
			}
			
			this.horzBaseline = Math.round(this.height / 2);
		}
	}
	
	display(context, x, y) {
		if (!this.expanded) {
			this.displayCollapsed(context, x, y);
			return;
		}
		
		if (Programming.codeStyle) {
			let child;
			for (let i = 0, n = this.children.length; i < n; ++i) {
				(child = this.children[i]).display(context, x + child.x, y + child.y);
			}
			
			let bkpStrokeStyle = context.strokeStyle;
			context.strokeStyle = "orange";
			
			context.beginPath();
			context.moveTo (x + 5, y);               // preventing obfuscation
			context.lineTo (x, y);                   // preventing obfuscation
			context.lineTo (x, y + this.height);     // preventing obfuscation
			context.lineTo (x + 5, y + this.height); // preventing obfuscation
			context.stroke();
			
			context.strokeStyle = bkpStrokeStyle;
		}
		else { // flowchart
			let child;
			for (let i = 0, n = this.children.length; i < n; ++i) {
				child = this.children[i];
				
				child.display(context, x + child.x, y + child.y);
			}
			
			let bkpStrokeStyle = context.strokeStyle;
			context.strokeStyle = "orange";
			context.strokeRect(0.5 + x, 0.5 + y, this.width - 1, this.height - 1);
			context.strokeStyle = bkpStrokeStyle;
		}
	}
}

Programming.IfWhileCode = class extends Expression {
	getTag() {
		switch (this.type) {
			case 0: return "Programming.If";
			case 1: return "Programming.IfElse";
			case 2: return "Programming.While";
		}
	}
	
	getName() {
		switch (this.type) {
			case 0: return Programming.messages.nameIfThen;
			case 1: return Programming.messages.nameIfThenElse;
			case 2: return Programming.messages.nameWhile;
		}
	}
	
	canHaveChildren(count) {
		return count == (this.type == 1 ? 3 : 2);
	}
	
	prepareDisplay(context) {
		if (Programming.codeStyle) {
			for (let i = 0, n = this.children.length; i < n; ++i) {
				this.children[i].prepareDisplay(context);
			}
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			switch (this.type) {
				case 1:
					this.elseWidth = Math.round(context.measureText(Programming.messages.literalElse).width);
				case 0:
					this.ifWhileWidth = Math.round(context.measureText(Programming.messages.literalIf).width);
					this.thenWidth = Math.round(context.measureText(Programming.messages.literalThen).width);
					this.endWidth = Math.round(context.measureText(Programming.messages.literalEndIf).width);
					break;
					
				case 2:
					this.ifWhileWidth = Math.round(context.measureText(Programming.messages.literalWhile).width);
					this.endWidth = Math.round(context.measureText(Programming.messages.literalEndWhile).width);
					break;
			}
			
			context.fontInfo.setBold(context, bkpBold);
			
			let child;
			
			// condition
			
			child = this.children[0];
			this.horzBaseline = child.horzBaseline;
			
			child.x = this.width = this.ifWhileWidth + 10;
			child.y = 0;
			
			this.width += child.width;
			this.height = child.height + 10;
			
			if (this.type != 2) {
				this.width += 10 + this.thenWidth;
			}
			
			// 'true' or while body
			
			child = this.children[1];
			let block = child.getTag() == "Programming.Block" && child.expanded;
			
			child.x = block ? 0 : 30; // indentation
			if (child.x + child.width > this.width) {
				this.width = child.x + child.width;
			}
			
			child.y = this.height;
			this.height += child.height + 10;
			
			// 'false' body
			
			if (this.type == 1) {
				child = this.children[2];
				block = child.getTag() == "Programming.Block" && child.expanded;
				
				child.x = block ? 0 : 30; // indentation
				if (child.x + child.width > this.width) {
					this.width = child.x + child.width;
				}
				
				this.height += context.fontInfo.size + 10;
				child.y = this.height;
				this.height += child.height + 10;
			}
			
			// end if, end while
			
			if (this.endWidth > this.width) {
				this.width = this.endWidth;
			}
			
			this.height += context.fontInfo.size;
			
			///
			
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchart
			switch (this.type) {
				case 0: { // if-then
						let condition = this.children[0];
						let right = this.children[1];
						
						let rightBorder = Programming.isBlock(right) ? 0 : 10;
						let extra = 5 + Math.round(context.measureText("?").width);
						
						condition.prepareDisplay(context);
						right.prepareDisplay(context);
						
						condition.x = condition.y = 10;
						this.vertBaseline = condition.x + Math.round((condition.width + extra) / 2);
						
						right.x = this.vertBaseline + 10 + rightBorder;
						if (right.x + right.vertBaseline < condition.x + condition.width + extra + 2 * 10) {
							right.x = condition.x + condition.width + extra + 2 * 10 - right.vertBaseline;
						}
						
						right.y = condition.y + condition.height + 2 * 10 + rightBorder;
						this.width = right.x + right.width + rightBorder;
						this.height = right.y + right.height + rightBorder + 10;
						this.horzBaseline = Math.round(this.height / 2);
					}
					break;
				
				case 1: { // if-then-else
						let condition = this.children[0];
						let left = this.children[1];
						let right = this.children[2];
						
						let leftBorder = Programming.isBlock(left) ? 0 : 10;
						let rightBorder = Programming.isBlock(right) ? 0 : 10;
						let semiBorder = 10 / 2;
						let extra = 5 + Math.round(context.measureText("?").width);
						
						condition.prepareDisplay(context);
						left.prepareDisplay(context);
						right.prepareDisplay(context);
						
						condition.y = 10;
						
						left.x = leftBorder;
						left.y = condition.y + condition.height + 2 * 10 + leftBorder;
						
						condition.x = leftBorder + left.vertBaseline + 2 * 10;
						if (condition.x + ((condition.width + extra) / 2) < leftBorder + left.width + leftBorder + semiBorder) {
							condition.x = leftBorder + left.width + leftBorder + semiBorder - Math.round((condition.width + extra) / 2);
						}
						
						this.vertBaseline = condition.x + Math.round((condition.width + extra) / 2);
						
						right.x = condition.x + condition.width + extra + (2 * 10) - right.vertBaseline;
						if (right.x - rightBorder < this.vertBaseline + semiBorder) {
							right.x = this.vertBaseline + semiBorder + rightBorder;
						}
						right.y = condition.y + condition.height + 2 * 10 + rightBorder;
						
						this.width = right.x + right.width + rightBorder;
						this.height = Math.max(left.y + left.height + leftBorder, right.y + right.height + rightBorder) + 10;
						
						this.horzBaseline = Math.round(this.height / 2);
					}
					break;
				
				case 2: { // while
						let condition = this.children[0];
						let body = this.children[1];
						
						//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
						let bodyBorder = 0;
						let extra = 5 + Math.round(context.measureText("?").width);
						
						condition.prepareDisplay(context);
						body.prepareDisplay(context);
						
						this.vertBaseline = 10 + Math.max(10 + Math.round((condition.width + extra)) / 2, bodyBorder + body.vertBaseline);
						
						condition.y = 10;
						body.y = condition.y + condition.height + 2 * 10 + bodyBorder;
						
						condition.x = this.vertBaseline - Math.round((condition.width + extra) / 2);
						body.x = this.vertBaseline - body.vertBaseline;
						
						this.width = this.vertBaseline + Math.max(10 + Math.round((condition.width + extra) / 2), body.width - body.vertBaseline + bodyBorder) + 10;
						this.height = body.y + body.height + bodyBorder + 10;
						this.horzBaseline = Math.round(this.height / 2);
					}
					break;
			}
		}
	}
	
	display(context, x, y) {
		if (Programming.codeStyle) {
			// children display
			
			let child;
			for (let i = 0, n = this.children.length; i < n; ++i) {
				(child = this.children[i]).display(context, x + child.x, y + child.y);
			}
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			// if, while
			child = this.children[0];
			super.drawText(context, this.type == 2 ? Programming.messages.literalWhile : Programming.messages.literalIf, x, y + child.horzBaseline + Math.round(context.fontInfo.size / 2));
			
			// then
			if (this.type != 2) {
				super.drawText(context, Programming.messages.literalThen, x + child.x + child.width + 10, y + child.horzBaseline + Math.round(context.fontInfo.size / 2));
			}
			
			// else
			if (this.type == 1) {
				child = this.children[1];
				super.drawText(context, Programming.messages.literalElse, x, y + child.y + child.height + 10 + context.fontInfo.size);
			}
			
			// end if, end while
			super.drawText(context, this.type == 2 ? Programming.messages.literalEndWhile : Programming.messages.literalEndIf, x, y + this.height);
			
			context.fontInfo.setBold(context, bkpBold);
			
			let bkpStrokeStyle = context.strokeStyle;
			context.strokeStyle = "orange";
			context.beginPath();
			
			// 'true' or 'while' |
			child = this.children[1];
			if (!(child.getTag() == "Programming.Block" && child.expanded)) {
				context.moveTo (x, y + child.y - 5);                // preventing obfuscation
				context.lineTo (x, y + child.y + child.height + 5); // preventing obfuscation
			}
			
			// 'false' |
			if (this.type == 1) {
				child = this.children[2];
				if (!(child.getTag() == "Programming.Block" && child.expanded)) {
					context.moveTo (x, y + child.y - 5);                // preventing obfuscation
					context.lineTo (x, y + child.y + child.height + 5); // preventing obfuscation
				}
			}
			
			context.stroke();
			context.strokeStyle = bkpStrokeStyle;
		}
		else { // workflow
			switch (this.type) {
				case 0: { // if-then
						let condition = this.children[0];
						let right = this.children[1];
						
						let rightBorder = Programming.isBlock(right) ? 0 : 10;
						
						let extra = 5 + Math.round(context.measureText("?").width);
						let offset = context.fontInfo.semiHeight;
						
						context.beginPath();
						context.moveTo(x + condition.x, y);
						context.lineTo(x + condition.x + condition.width + extra, y);
						context.lineTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x + condition.width + extra, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x, y);
						context.stroke();
						
						condition.display(context, x + condition.x, y + condition.y);
						
						//  -7
						context.beginPath();
						context.moveTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + right.x + right.vertBaseline, y + condition.y + condition.height / 2);
						context.lineTo(x + right.x + right.vertBaseline, y + condition.y + condition.height + 2 * 10);
						context.stroke();
						
						right.display(context, x + right.x, y + right.y);
						
						super.drawText(context, "?", x + condition.x + condition.width + 5, y + condition.y + condition.horzBaseline + offset);

						if (rightBorder != 0) {
							context.strokeRect(x + right.x - rightBorder, y + right.y - rightBorder, right.width + 2 * rightBorder, right.height + 2 * rightBorder);
						}
						
						// | below condition
						context.beginPath();
						context.moveTo(x + this.vertBaseline, y + condition.y + condition.height + 10);
						context.lineTo(x + this.vertBaseline, y + this.height);
						context.stroke();
						
						// | below true-branch
						context.beginPath();
						context.moveTo(x + right.x + right.vertBaseline, y + this.height - 10);
						context.lineTo(x + right.x + right.vertBaseline, y + this.height);
						context.lineTo(x + this.vertBaseline, y + this.height);
						context.stroke();
					}
					break;
				
				case 1: { // if-then-else
						let condition = this.children[0];
						let left = this.children[1];
						let right = this.children[2];
						
						let leftBorder = Programming.isBlock(left) ? 0 : 10;
						let rightBorder = Programming.isBlock(right) ? 0 : 10;
						
						let extra = 5 + Math.round(context.measureText("?").width);
						let offset = context.fontInfo.semiHeight;
						
						context.beginPath();
						// condition diamond
						context.moveTo(x + condition.x, y);
						context.lineTo(x + condition.x + condition.width + extra, y);
						context.lineTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x + condition.width + extra, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x, y);
						context.stroke();
						
						condition.display(context, x + condition.x, y + condition.y);
						
						super.drawText(context, "?", x + condition.x + condition.width + 5, y + condition.y + condition.horzBaseline + offset);
						
						let bkpStyle = context.strokeStyle;
						context.strokeStyle = "green";
						
						context.beginPath();
						context.moveTo(x + condition.x - 10, y + condition.y + condition.height / 2);
						context.lineTo(x + left.x + left.vertBaseline, y + condition.y + condition.height / 2);
						context.lineTo(x + left.x + left.vertBaseline, y + left.y - leftBorder);
						context.stroke();
						
						//context.beginPath();
						//context.moveTo(x + left.x + left.vertBaseline, y + left.y + left.height + leftBorder);
						//context.lineTo(x + left.x + left.vertBaseline, y + this.height);
						//context.lineTo(x + this.vertBaseline, y + this.height);
						//context.stroke();
						
						context.strokeStyle = bkpStyle;
						
						if (leftBorder != 0) {
							context.strokeRect(x + left.x - leftBorder, y + left.y - leftBorder, left.width + 2 * leftBorder, left.height + 2 * leftBorder);
						}
						left.display(context, x + left.x, y + left.y);
						
						if (rightBorder != 0) {
							context.strokeRect(x + right.x - rightBorder, y + right.y - rightBorder, right.width + 2 * rightBorder, right.height + 2 * rightBorder);
						}
						right.display(context, x + right.x, y + right.y);
						
						bkpStyle = context.strokeStyle;
						context.strokeStyle = "red";
						
						context.beginPath();
						context.moveTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + right.x + right.vertBaseline, y + condition.y + condition.height / 2);
						context.lineTo(x + right.x + right.vertBaseline, y + right.y - rightBorder);
						context.stroke();
						
						//context.beginPath();
						//context.moveTo(x + right.x + right.vertBaseline, y + right.y + right.height + rightBorder);
						//context.lineTo(x + right.x + right.vertBaseline, y + this.height);
						//context.lineTo(x + this.vertBaseline, y + this.height);
						//context.stroke();
						
						context.strokeStyle = bkpStyle;
						
						context.beginPath();
						context.moveTo(x + left.x + left.vertBaseline, y + left.y + left.height + leftBorder);
						context.lineTo(x + left.x + left.vertBaseline, y + this.height);
						//context.moveTo(x + left.x + left.vertBaseline, y + this.height);
						context.lineTo(x + right.x + right.vertBaseline, y + this.height);
						context.lineTo(x + right.x + right.vertBaseline, y + right.y + right.height + rightBorder);
						context.stroke();
					}
					break;
				
				case 2: { // while
						let condition = this.children[0];
						let body = this.children[1];
						
						//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
						let bodyBorder = 0;
						let extra = 5 + Math.round(context.measureText("?").width);
						let offset = context.fontInfo.semiHeight;
						
						//  0 ->
						//  ___
						// /   \
						// \___/
						
						context.beginPath();
						context.moveTo(x + condition.x, y);
						context.lineTo(x + condition.x + condition.width + extra, y);
						context.lineTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x + condition.width + extra, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x, y + condition.y + condition.height + 10);
						context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x, y);
						context.stroke();
						
						condition.display(context, x + condition.x, y + condition.y);

						super.drawText(context, "?", x + condition.x + condition.width + 5, y + condition.y + condition.horzBaseline + offset);
						
						//      0 ->
						//  __  __
						// |	  |
						// |______|
						
						context.beginPath();
						context.moveTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
						context.lineTo(x + this.width, y + condition.y + condition.height / 2);
						context.lineTo(x + this.width, y + this.height);
						context.lineTo(x, y + this.height);
						context.lineTo(x, y + condition.y + condition.height / 2);
						context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
						context.stroke();
						
						if (bodyBorder != 0) {
							context.strokeRect(x + body.x - bodyBorder, y + body.y - bodyBorder, body.width + 2 * bodyBorder, body.height + 2 * bodyBorder);
						}
						
						body.display(context, x + body.x, y + body.y);
					}
					break;
			}
		}
	}
	
	moveAcross(son, direction) {
		if (direction == Expression.UP) {
			if (son != 0) {
				return this.children[son - 1].moveTo(direction);
			}
		}
		else if (direction == Expression.DOWN) {
			if (son != this.children.length - 1) {
				return this.children[son + 1].moveTo(direction);
			}
		}
		
		return this.moveOut(direction);
	}
	
	moveTo(direction) {
		if (direction == Expression.UP) {
			return this.children[this.children.length - 1].moveTo(direction);
		}
		else {
			return this.children[0].moveTo(direction);
		}
	}
}

Programming.ForCode = class extends Expression {
	getTag() {
		switch (this.type) {
			case 0: return "Programming.ForTimes";
			case 1: return "Programming.ForFromTo";
			case 2: return "Programming.ForIn";
		}
	}
	
	getName() {
		switch (this.type) {
			case 0: return Programming.messages.nameForTimes;
			case 1: return Programming.messages.nameForFromTo;
			case 2: return Programming.messages.nameForIn;
		}
	}
	
	canHaveChildren(count) {
		switch (this.type) {
			case 0: return count == 2;
			case 1: return count >= 4 && count <= 5;
			case 2: return count == 3;
		}
	}
	
	prepareDisplay(context) {
		if (Programming.codeStyle) {
			// children preparation
			
			let child;
			let body = this.children[0];
			let i, n = this.children.length;
			
			this.horzBaseline = 0;
			let maxSemi = 0;
			
			body.prepareDisplay(context);
			
			for (i = 1; i < n; ++i) {
				(child = this.children[i]).prepareDisplay(context);
				if (child.horzBaseline > this.horzBaseline) {
					this.horzBaseline = child.horzBaseline;
				}
				if (child.height - child.horzBaseline > maxSemi) {
					maxSemi = child.height - child.horzBaseline;
				}
			}
			
			for (i = 1; i < n; ++i) {
				child = this.children[i];
				child.y = this.horzBaseline - child.horzBaseline;
			}
			
			// labels
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			this.forWidth = Math.round(context.measureText(Programming.messages.literalFor).width);
			this.endWidth = Math.round(context.measureText(Programming.messages.literalEndFor).width);
			
			if (n == 2) {
				this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalTimes).width);
			}
			else if (n == 3) {
				this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalIn).width);
			}
			else { // n >= 4
				this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalFrom).width);
				this.toWidth = Math.round(context.measureText(Programming.messages.literalTo).width);
				if (n == 5) this.stepWidth = Math.round(context.measureText(Programming.messages.literalStep).width);
			}
			
			context.fontInfo.setBold(context, bkpBold);
			
			this.width = (this.children[1].x = this.forWidth + 10) + this.children[1].width;
			if (n == 2) {
				this.width += 10 + this.timesInFromWidth;
			}
			else if (n == 3) {
				this.width = (this.children[2].x = this.width + 10 + this.timesInFromWidth + 10) + this.children[2].width;
			}
			else { // n >= 4
				this.width = (this.children[2].x = this.width + 10 + this.timesInFromWidth + 10) + this.children[2].width;
				this.width = (this.children[3].x = this.width + 10 + this.toWidth + 10) + this.children[3].width;
				
				if (n == 5) {
					this.width = (this.children[4].x = this.width + 10 + this.stepWidth + 10) + this.children[4].width;
				}
			}
			
			if (body.getTag() == "Programming.Block" &&	body.expanded) {
				body.x = 0;
			}
			else {
				body.x = 30;
			}
			
			if (body.x + body.width > this.width) {
				this.width = body.x + body.width;
			}
			this.height = (body.y = this.horzBaseline + maxSemi + 10) +	body.height + 10 + context.fontInfo.size;
			
			if (this.endWidth > this.width) this.width = this.endWidth;
			
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchart
			let child;
			let body = this.children[0];
			
			let i, n = this.children.length;
			//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
			let bodyBorder = 0;
			
			this.horzBaseline = 0;
			let maxSemi = 0;
			
			body.prepareDisplay(context);
			
			for (i = 1; i < n; ++i) {
				(child = this.children[i]).prepareDisplay(context);
				if (child.horzBaseline > this.horzBaseline) {
					this.horzBaseline = child.horzBaseline;
				}
				if (child.height - child.horzBaseline > maxSemi) {
					maxSemi = child.height - child.horzBaseline;
				}
			}
			
			for (i = 1; i < n; ++i) {
				child = this.children[i];
				child.y = 10 + this.horzBaseline - child.horzBaseline;
			}
			
			this.width = (this.children[1].x = 10) + this.children[1].width;
			
			if (n >= 3) {
				this.width = (this.children[2].x = this.width + 3 + Math.round(context.measureText(":").width) + 2) + this.children[2].width;
			}
			
			if (n >= 4) {
				this.width = (this.children[3].x = this.width + 3 + Math.round(context.measureText("..").width) + 2) + this.children[3].width;
			}
			
			if (n == 5) {
				this.width = (this.children[4].x = this.width + 10 + Math.round(context.measureText("\u2206").width + 2)) + this.children[4].width;
			}
			
			this.width += 10;
			this.height = (body.y = 10 + this.horzBaseline + maxSemi + 10 + 10 + bodyBorder) + body.height + bodyBorder + 10;
			this.vertBaseline = 10 + Math.max(Math.round(this.width / 2), body.vertBaseline + bodyBorder);
			let diff = this.vertBaseline - Math.round(this.width / 2);
			this.width = this.vertBaseline + Math.max(Math.round(this.width / 2), body.width - body.vertBaseline + bodyBorder) + 10;
			
			body.x = this.vertBaseline - body.vertBaseline;
			
			for (i = 1; i < n; ++i) {
				this.children[i].x += diff;
			}
			
			this.horzBaseline += 10;
		}
	}
		
	display(context, x, y) {
		if (Programming.codeStyle) {
			let child, body = this.children[0];
			let i, n = this.children.length;
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			for (i = 0; i < n; ++i) {
				child = this.children[i];
				
				switch (i) {
					case 0:
						super.drawText(context, Programming.messages.literalFor, x, y + this.horzBaseline + Math.round(context.fontInfo.size / 2));
						break;
						
					case 1:
						super.drawText(
							context,
							n == 2 ? Programming.messages.literalTimes : (n == 3 ? Programming.messages.literalIn : Programming.messages.literalFrom),
							x + child.x + child.width + 10,
							y + this.horzBaseline + Math.round(context.fontInfo.size / 2)
						);
						break;
						
					case 2:
						if (n >= 4) super.drawText(context, Programming.messages.literalTo, x + child.x + child.width + 10, y + this.horzBaseline + Math.round(context.fontInfo.size / 2));
						break;
						
					case 3:
						if (n == 5) super.drawText(context, Programming.messages.literalStep, x + child.x + child.width + 10, y + this.horzBaseline + Math.round(context.fontInfo.size / 2));
						break;
				}
			}
			
			super.drawText(context, Programming.messages.literalEndFor, x, y + body.y + body.height + 10 + context.fontInfo.size);
			
			context.fontInfo.setBold(context, bkpBold);
			
			for (i = 0; i < n; ++i) {
				(child = this.children[i]).display(context, x + child.x, y + child.y);
			}
			
			if (!(body.getTag() == "Programming.Block" && body.expanded)) {
				let bkpStrokeStyle = context.strokeStyle;
				context.strokeStyle = "orange";
				context.beginPath();
				context.moveTo (x, y + body.y - 5);               // preventing obfuscation
				context.lineTo (x, y + body.y + body.height + 5); // preventing obfuscation
				context.stroke();
				context.strokeStyle = bkpStrokeStyle;
			}
		}
		else { // flowchart
			let child = null;
			let body = this.children[0];
			
			//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
			let bodyBorder = 0;
			let n = this.children.length;
			
			let offset = context.fontInfo.semiHeight;
			
			//  ___
			// |0 1|
			// |3 2|
			// |___|
			
			context.beginPath();
			context.moveTo(x + this.children[1].x - 10, y);
			context.lineTo(x + this.children[n - 1].x + this.children[n - 1].width + 10, y);
			context.lineTo(x + this.children[n - 1].x + this.children[n - 1].width + 10, y + body.y - bodyBorder - 10);
			context.lineTo(x + this.children[1].x - 10, y + body.y - bodyBorder - 10);
			context.lineTo(x + this.children[1].x - 10, y);
			context.stroke();
			
			//xs[0] = xs[3] = x + getChild(1).x - ProgrammingVisualization.BORDER;
			//xs[1] = xs[2] = x + getChild(n - 1).x + getChild(n - 1).width + ProgrammingVisualization.BORDER;
			//ys[0] = ys[1] = y;
			//ys[2] = ys[3] = y + body.y - bodyBorder - ProgrammingVisualization.BORDER;
			//g.drawPolygon(xs, ys, 4);
			
			for (let i = 1; i < n; ++i) {
				if (i == 2) {
					super.drawText(context, ":", x + child.x + child.width + 3, y + this.horzBaseline + offset);
				}
				
				if (i == 3) {
					super.drawText(context, "..", x + child.x + child.width + 3, y + this.horzBaseline + offset);
				}
				
				if (i == 4) {
					super.drawText(context, "\u2206", x + child.x + child.width + 10, y + this.horzBaseline + offset);
				}
				
				child = this.children[i];
				child.display(context, x + child.x, y + child.y);
			}
			
			//  __  __
			// |45  01|
			// |3    2|
			// |______|
			
			context.beginPath();
			context.moveTo(x + this.children[n - 1].x + this.children[n - 1].width + 10, y + this.horzBaseline);
			context.lineTo(x + this.width, y + this.horzBaseline);
			context.lineTo(x + this.width, y + this.height);
			context.lineTo(x, y + this.height);
			context.lineTo(x, y + this.horzBaseline);
			context.lineTo(x + this.children[1].x - 10, y + this.horzBaseline);
			context.stroke();
			
			if (bodyBorder != 0) {
				context.strokeRect(x + body.x - bodyBorder, y + body.y - bodyBorder, body.width + 2 * bodyBorder, body.height + 2 * bodyBorder);
			}
			
			body.display(context, x + body.x, y + body.y);
		}
	}
	
	moveAcross(son, direction) {
		let n = this.children.length;
		
		if (direction == Expression.PREVIOUS) {
			if (son > 1) return this.children[son - 1].moveTo(direction);
		}
		else if (direction == Expression.NEXT) {
			if (son > 0 && son < n - 1) return this.children[son + 1].moveTo(direction);
		}
		else if (direction == Expression.UP) {
			if (son == 0) return this.children[1].moveTo(direction);
		}
		else if (direction == Expression.DOWN) {
			if (son != 0) return this.children[0].moveTo(direction);
		}
		
		return this.moveOut(direction);
	}
	
	moveTo(direction) {
		if (direction == Expression.DOWN || direction == Expression.NEXT) {
			return this.children[1].moveTo(direction);
		}
		else if (direction == Expression.UP) {
			return this.children[0].moveTo(direction);
		}
		else { // LEFT
			return this.children[this.children.length - 1].moveTo(direction);
		}
	}
}

Programming.InvertedFor = class extends Expression {
	getTag() {
		switch (this.type) {
			case 0: return "Programming.InvertedForTimes";
			case 1: return "Programming.InvertedForFromTo";
			case 2: return "Programming.InvertedForIn";
		}
	}
	
	getName() {
		switch (this.type) {
			case 0: return Programming.messages.nameInvertedForTimes;
			case 1: return Programming.messages.nameInvertedForFromTo;
			case 2: return Programming.messages.nameInvertedForIn;
		}
	}
	
	canHaveChildren(count) {
		switch (this.type) {
			case 0: return count == 2;
			case 1: return count >= 4 && count <= 5;
			case 2: return count == 3;
		}
	}
	
	prepareDisplay(context) {
		// children preparation
		
		let child;
		let i, n = this.children.length;
		
		this.horzBaseline = 0;
		let maxSemi = 0;
		
		for (i = 0; i < n; ++i) {
			(child = this.children[i]).prepareDisplay(context);
			if (child.horzBaseline > this.horzBaseline) {
				this.horzBaseline = child.horzBaseline;
			}
			if (child.height - child.horzBaseline > maxSemi) {
				maxSemi = child.height - child.horzBaseline;
			}
		}
		
		for (i = 0; i < n; ++i) {
			child = this.children[i];
			child.y = this.horzBaseline - child.horzBaseline;
		}
		
		// labels
		
		{
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			this.forWidth = Math.round(context.measureText(Programming.messages.literalFor).width);
			
			context.fontInfo.setBold(context, bkpBold);
		}
		
		if (n == 2) {        // expr for n times
			this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalTimes).width);
		}
		else if (n == 3) {   // expr for i in list
			this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalInvertedIn).width);
		}
		else { // n >= 4     // expr for i form a to b [ step s ]
			this.timesInFromWidth = Math.round(context.measureText(Programming.messages.literalInvertedFrom).width);
			this.toWidth = Math.round(context.measureText(Programming.messages.literalInvertedTo).width);
			if (n == 5) this.stepWidth = Math.round(context.measureText(Programming.messages.literalInvertedStep).width);
		}
		
		
		this.children[0].x = 0; // expr
		this.width = this.children[0].width + 10 + this.forWidth + 10;
		this.children[1].x = this.width; // symbol
		this.width += this.children[1].width + 10;
		
		if (n == 2) {      // expr for n times
			this.width += this.timesInFromWidth;
		}
		else if (n == 3) { // expr for i in list
			this.width += this.timesInFromWidth + 10;
			this.children[2].x = this.width; // list
			this.width += this.children[2].width + 10;
		}
		else { // n >= 4   // expr for i from a to b [ step s ]
			this.width += this.timesInFromWidth + 10;
			this.children[2].x = this.width; // from
			this.width += this.children[2].width + 10;
			this.width += this.toWidth + 10;
			this.children[3].x = this.width; // to
			this.width += this.children[3].width;
			
			if (n == 5) {
				this.width += 10 + this.stepWidth + 10;
				this.children[4].x = this.width;
				this.width += this.children[4].width;
			}
		}
		
		this.height = this.horzBaseline + maxSemi;
		this.vertBaseline = Math.round(this.width / 2);
	}
		
	display(context, x, y) {
		let child;
		let i, n = this.children.length;
		
		for (i = 0; i < n; ++i) {
			child = this.children[i];
			
			switch (i) {
				case 0: {
						let bkpBold = context.fontInfo.bold;
						context.fontInfo.setBold(context, true);
						
						super.drawText(
							context, Programming.messages.literalFor,
							x + child.width + 10,
							y + this.horzBaseline + Math.round(context.fontInfo.size / 2)
						);
						
						context.fontInfo.setBold(context, bkpBold);
					}
					break;
					
				case 1:
					super.drawText(
						context,
						n == 2 ? Programming.messages.literalTimes : (n == 3 ? Programming.messages.literalInvertedIn : Programming.messages.literalInvertedFrom),
						x + child.x + child.width + 10,
						y + this.horzBaseline + Math.round(context.fontInfo.size / 2)
					);
					break;
					
				case 2:
					if (n >= 4) {
						super.drawText(
							context,
							Programming.messages.literalInvertedTo,
							x + child.x + child.width + 10,
							y + this.horzBaseline + Math.round(context.fontInfo.size / 2)
						);
					}
					break;
					
				case 3:
					if (n == 5) {
						super.drawText(
							context,
							Programming.messages.literalInvertedStep,
							x + child.x + child.width + 10,
							y + this.horzBaseline + Math.round(context.fontInfo.size / 2)
						);
					}
					break;
			}
		}
		
		for (i = 0; i < n; ++i) {
			(child = this.children[i]).display(context, x + child.x, y + child.y);
		}
	}
}

Programming.Cycle = class extends Expression.SummationLikeSymbol {
	constructor() {
		super();
		this.symbol = "⟳";
	}
	
	getTag() { return "Programming.Cycle"; }
	getName() { return Programming.messages.nameCycle; }
}

Programming.UntilCode = class extends Expression.BinaryExpression {
	getTag() { return "Programming.Until"; }
	getName() { return Programming.messages.nameUntil; }

	prepareDisplay(context) {
		if (Programming.codeStyle) {
			let body = this.children[0];
			let condition = this.children[1];
			let block = body.getTag() == "Programming.Block" &&	body.expanded;
			
			body.prepareDisplay(context);
			condition.prepareDisplay(context);
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			this.doWidth = Math.round(context.measureText(Programming.messages.literalo).width);
			this.untilWidth = Math.round(context.measureText(Programming.messages.literalUntil).width);
			
			context.fontInfo.setBold(context, bkpBold);
			
			this.width = (block ? 0 : 30) + body.width;
			
			if (this.untilWidth + 10 + condition.width > this.width) {
				this.width = this.untilWidth + 10 + condition.width;
			}
			
			body.x = block ? 0 : 30;
			condition.x = this.untilWidth + 10;
			
			body.y = this.height = context.fontInfo.size + 10;
			this.height += body.height + 10;
			condition.y = this.height;
			this.height += condition.height;
			
			this.horzBaseline = body.horzBaseline;
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchart
			let body = this.children[0];
			let condition = this.children[1];
			
			//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
			let bodyBorder = 0;
			let extra = 5 + Math.round(context.measureText("?").width);
			
			condition.prepareDisplay(context);
			body.prepareDisplay(context);
			
			this.vertBaseline = 10 + Math.max(10 + Math.round((condition.width + extra) / 2), bodyBorder + body.vertBaseline);
			
			body.y = 10;
			condition.y = body.y + body.height + 2 * 10 + bodyBorder;
			
			body.x = this.vertBaseline - Math.round(body.width / 2);
			condition.x = this.vertBaseline - Math.round(condition.vertBaseline + extra / 2);
			
			this.width = this.vertBaseline + Math.max(10 + Math.round((condition.width + extra) / 2), body.width - body.vertBaseline + bodyBorder) + 10;
			this.height = condition.y + condition.height + bodyBorder + 10;
			this.horzBaseline = Math.round(this.height / 2);
		}
	}
	
	display(context, x, y) {
		if (Programming.codeStyle) {
			let body = this.children[0];
			let condition = this.children[1];
			
			let bkpBold = context.fontInfo.bold;
			context.fontInfo.setBold(context, true);
			
			super.drawText(context, Programming.messages.literalDo, x, y + context.fontInfo.size);
			super.drawText(context, Programming.messages.literalUntil, x, y + condition.y + condition.horzBaseline + Math.round(context.fontInfo.size / 2));
			
			context.fontInfo.setBold(context, bkpBold);
			
			body.display(context, x + body.x, y + body.y);
			condition.display(context, x + condition.x, y + condition.y);
			
			if (!(body.getTag() == "Programming.Block" && body.expanded)) {
				let bkpStrokeStyle = context.strokeStyle;
				context.strokeStyle = "orange";
				context.beginPath();
				context.moveTo (x, y + body.y - 5);               // preventing obfuscation
				context.lineTo (x, y + body.y + body.height + 5); // preventing obfuscation
				context.stroke();
				context.strokeStyle = bkpStrokeStyle;
			}
		}
		else { // flowchart
			let body = this.children[0];
			let condition = this.children[1];
			
			//let bodyBorder = Programming.isBlock(body) ? 0 : 10;
			let bodyBorder = 0;
			let extra = 5 + Math.round(context.measureText("?").width);
			let offset = context.fontInfo.semiHeight;
			
			//  0 ->
			//  ___
			// /   \
			// \___/
			
			context.beginPath();
			context.moveTo(x + condition.x, y + condition.y - 10);
			context.lineTo(x + condition.x + condition.width + extra, y + condition.y - 10);
			context.lineTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
			context.lineTo(x + condition.x + condition.width + extra, y + this.height);
			context.lineTo(x + condition.x, y + this.height);
			context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
			context.lineTo(x + condition.x, y + condition.y - 10);
			context.stroke();
			
			condition.display(context, x + condition.x, y + condition.y);

			super.drawText(context, "?", x + condition.x + condition.width + 5, y + condition.y + condition.horzBaseline + offset);
			
			//      0 ->
			//  __  __
			// |	  |
			// |______|
			
			context.beginPath();
			context.moveTo(x + condition.x + condition.width + extra + 10, y + condition.y + condition.height / 2);
			context.lineTo(x + this.width, y + condition.y + condition.height / 2);
			context.lineTo(x + this.width, y);
			context.lineTo(x, y);
			context.lineTo(x, y + condition.y + condition.height / 2);
			context.lineTo(x + condition.x - 10, y + condition.y + condition.height / 2);
			context.stroke();
			
			if (bodyBorder != 0) {
				context.strokeRect(x + body.x - bodyBorder, y + body.y - bodyBorder, body.width + 2 * bodyBorder, body.height + 2 * bodyBorder);
			}
			
			body.display(context, x + body.x, y + body.y);
		}
	}
}

Programming.Conditional = class extends Expression {
	getTag() { return "Programming.Conditional"; }
	getName() { return Programming.messages.nameConditional; }
	canHaveChildren(count) { return count == 3; }

	prepareDisplay(context) {
		let i, child;
		
		this.width = 0;
		this.horzBaseline = 0;
		let maxSemiHeight = 0;
		
		for (i = 0; i < 3; ++i) {
			if (i > 0) this.width += 2;
			
			(child = this.children[i]).prepareDisplay(context);
			
			this.width += 5;
			child.x = this.width;
			this.width += child.width + 5;
			
			if (child.horzBaseline > this.horzBaseline) {
				this.horzBaseline = child.horzBaseline;
			}
			
			if (child.height - child.horzBaseline > maxSemiHeight) {
				maxSemiHeight = child.height - child.horzBaseline;
			}
		}
		
		this.horzBaseline += 5;
		
		for (i = 0; i < 3; ++i) {
			child = this.children[i];
			child.y = this.horzBaseline - child.horzBaseline;
		}
		
		this.height = this.horzBaseline + maxSemiHeight + 5;
		this.vertBaseline = Math.round(this.width / 2);
	}
	
	display(context, x, y) {
		let c = this.children[0];
		let t = this.children[1];
		let f = this.children[2];
		
		let bkpStrokeStyle = context.strokeStyle;
		context.strokeStyle = "gray";
		context.strokeRect(x, y, 5 + c.width + 5, this.height);
		context.strokeStyle = "green";
		context.strokeRect(x + t.x - 5, y, 5 + t.width + 5, this.height);
		context.strokeStyle = "red";
		context.strokeRect(x + f.x - 5, y, 5 + f.width + 5, this.height);
		context.strokeStyle = bkpStrokeStyle;
		
		c.display(context, x + c.x, y + c.y);
		t.display(context, x + t.x, y + t.y);
		f.display(context, x + f.x, y + f.y);
	}
}

Programming.prepareDisplaySwitchFlowchart = function(comparative, expr, context) {
	expr.width = 0;
	//expr.height = 10;
	
	// cases
	
	let cases = comparative ? Math.floor((expr.children.length - 1) / 2) : Math.floor(expr.children.length / 2);
	let child1, child2;
	let border1, border2;
	let max1 = 0, max2 = 0;
	
	for (let c = 0; c < cases; ++c) {
		if (comparative) {
			child1 = expr.children[2 * c + 1];
			child2 = expr.children[2 * c + 2];
		}
		else {
			child1 = expr.children[2 * c    ];
			child2 = expr.children[2 * c + 1];
		}
		
		child1.prepareDisplay(context);
		child2.prepareDisplay(context);
		
		border1 = child1.getTag() === "Null" ? 0 : 10;
		border2 = Programming.isBlock(child2) ? 0 : 10;
		
		if (c > 0) expr.width += 10;
		
		child1.y = 10 + border1;
		
		expr.width += Math.max(border1 + child1.vertBaseline, border2 + child2.vertBaseline);
		child1.x = expr.width - child1.vertBaseline;
		child2.x = expr.width - child2.vertBaseline;
		expr.width += Math.max(child1.width - child1.vertBaseline + border1, child2.width - child2.vertBaseline + border2);
		
		if (border1 + child1.height + border1 > max1) max1 = border1 + child1.height + border1;
		if (border2 + child2.height + border2 > max2) max2 = border2 + child2.height + border2;
	}
	
	for (let c = 0; c < cases; ++c) {
		if (comparative) {
			child2 = expr.children[2 * c + 2];
		}
		else {
			child2 = expr.children[2 * c + 1];
		}
		
		border2 = Programming.isBlock(child2) ? 0 : 10;
		
		child2.y = 10 + max1 + 10 + border2;
	}
	
	// else (if any)
	
	if (
		(comparative  && (expr.children.length % 2) == 0) ||
		(!comparative && (expr.children.length % 2) != 0)
	) {
		(child2 = expr.children[expr.children.length - 1]).prepareDisplay(context);
		border2 = Programming.isBlock(child2) ? 0 : 10;
		
		expr.width += 10;
		child2.x = expr.width + border2;
		expr.width = child2.x + child2.width + border2;
		
		child2.y = 10 + max1 + 10 + border2;
		if (border2 + child2.height + border2 > max2) max2 = border2 + child2.height + border2;
	}
	
	// end switch
	
	expr.height = 10 + max1 + 10 + max2 + 10;
	expr.vertBaseline = Math.round(expr.width / 2);
	expr.horzBaseline = Math.round(expr.height / 2);
};

Programming.displaySwitchFlowchart = function(comparative, expr, context, x, y) {
	let cases = comparative ? Math.floor((expr.children.length - 1) / 2) : Math.floor(expr.children.length / 2);
	
	// cases
	
	let child1, child2;
	let border1, border2;
	
	let h = y, v;
	if (comparative) {
		h += expr.children[1].y - (expr.children[1].getTag() === "Null" ? 0 : 10) - 10;
	}
	
	for (let c = 0; c < cases; ++c) {
		if (comparative) {
			child1 = expr.children[2 * c + 1];
			child2 = expr.children[2 * c + 2];
		}
		else {
			child1 = expr.children[2 * c    ];
			child2 = expr.children[2 * c + 1];
		}
		
		border1 = child1.getTag() === "Null" ? 0 : 10;
		border2 = Programming.isBlock(child2) ? 0 : 10;
		
		if (comparative) {
			if (border1 > 0) { // comparand rectangle (if not null)
				context.strokeRect(x + child1.x - 10, y + child1.y - 10, 10 + child1.width + 10, 10 + child1.height + 10);
			}
		}
		else { // condition diamond
			let extra = 0;
			
			context.beginPath();
			context.moveTo(x + child1.x,                             y + child1.y - 10);
			context.lineTo(x + child1.x + child1.width + extra,      y + child1.y - 10);
			context.lineTo(x + child1.x + child1.width + extra + 10, y + child1.y + child1.height / 2);
			context.lineTo(x + child1.x + child1.width + extra,      y + child1.y + child1.height + 10);
			context.lineTo(x + child1.x,                             y + child1.y + child1.height + 10);
			context.lineTo(x + child1.x - 10,                        y + child1.y + child1.height / 2);
			context.lineTo(x + child1.x,                             y + child1.y - 10);
			context.stroke();
		}
		
		// action rectangle (if not null);
		if (border2 > 0) {
			context.strokeRect(x + child2.x - 10, y + child2.y - 10, 10 + child2.width + 10, 10 + child2.height + 10);
		}
		
		// vertical lines (3)
		v = x + child2.x + child2.vertBaseline;
		context.beginPath();
		context.moveTo(v, h); context.lineTo(v, h + 10);
		context.moveTo(v, y + child1.y + child1.height + border1); context.lineTo(v, y + child2.y - border2);
		context.moveTo(v, y + child2.y + child2.height + border2); context.lineTo(v, y + expr.height);
		context.stroke();
	}
	
	// else (if any)
	
	if (
		(comparative  && (expr.children.length % 2) == 0) ||
		(!comparative && (expr.children.length % 2) != 0)
	) {
		child2 = expr.children[expr.children.length - 1];
		border2 = Programming.isBlock(child2) ? 0 : 10;
		
		// action rectangle (if not null);
		
		if (border2 > 0) {
			context.strokeRect(x + child2.x - 10, y + child2.y - 10, child2.width + 20, child2.height + 20);
		}
		
		// vertical lines (2)
		
		v = x + child2.x + child2.vertBaseline;
		context.beginPath();
		context.moveTo(v, h);                                      context.lineTo(v, y + child2.y - border2);
		context.moveTo(v, y + child2.y + child2.height + border2); context.lineTo(v, y + expr.height);
		context.stroke();
	}
	
	// horizontal lines (2)
	
	child1 = expr.children[comparative ? 2 : 1];
	child2 = expr.children[expr.children.length - 1];
	
	//h = y;
	
	context.beginPath();
	context.moveTo(x + child1.x + child1.vertBaseline, h);               context.lineTo(x + child2.x + child2.vertBaseline, h);
	context.moveTo(x + child1.x + child1.vertBaseline, y + expr.height); context.lineTo(x + child2.x + child2.vertBaseline, y + expr.height);
	context.stroke();
	
	// subexpressions
	
	let child;
	for (let i = comparative ? 1 : 0, n = expr.children.length; i < n; ++i) {
		child = expr.children[i];
		child.display(context, x + child.x, y + child.y);
	}
};

Programming.ComparativeSwitch = class extends Expression {
	getTag() { return "Programming.ComparativeSwitch"; }
	getName() { return Programming.messages.nameComparativeSwitch; }
	canHaveChildren(count) { return count >= 3; }
	
	prepareDisplay(context) {
		if (Programming.codeStyle) {
			let child;
			
			let bkpBold = context.fontInfo.italic;
			context.fontInfo.setBold(context, true);
			
			let v1 = Math.round(30 + context.measureText(Programming.messages.literalWhen).width + 10);
			let v2 = 0;
			
			// comparand
			
			(child = this.children[0]).prepareDisplay(context);
			
			child.x = Math.round(context.measureText(Programming.messages.literalSwitch).width + 10);
			child.y = 0;
			
			context.fontInfo.setBold(context, bkpBold);
			
			this.width = child.x + child.width;
			this.height = child.height + 10;
			
			// cases
			
			let cases = Math.floor((this.children.length - 1) / 2);
			let child1, child2;
			
			for (let c = 0; c < cases; ++c) {
				(child1 = this.children[2 * c + 1]).prepareDisplay(context);
				(child2 = this.children[2 * c + 2]).prepareDisplay(context);
				
				child1.x = v1;
				
				this.height += Math.max(child1.horzBaseline, child2.horzBaseline);
				child1.y = this.height - child1.horzBaseline;
				child2.y = this.height - child2.horzBaseline;
				this.height += Math.max(child1.height - child1.horzBaseline, child2.height - child2.horzBaseline);
				this.height += 10;
				
				if (child1.width > v2) v2 = child1.width;
			}
			
			v2 = v1 + v2 + 10 + 10;
			
			for (let c = 0; c < cases; ++c) {
				child2 = this.children[2 * c + 2];
				
				child2.x = v2;
				if (child2.x + child2.width > this.width) this.width = child2.x + child2.width;
			}
			
			// else (if any)
			
			if ((this.children.length % 2) == 0) {
				(child = this.children[this.children.length - 1]).prepareDisplay(context);
				
				child.y = this.height;
				this.height += child.height;
				this.height += 10;
				
				child.x = v1;
				if (child.x + child.width > this.width) this.width = child.x + child.width;
			}
			
			// end switch
			
			this.height += context.fontInfo.size;
			this.horzBaseline = this.children[0].horzBaseline;
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchart
			Programming.prepareDisplaySwitchFlowchart(true, this, context);
			
			let comparand = this.children[0];
			comparand.prepareDisplay(context);
			let border = comparand.getTag() === "Null" ? 0 : 10;
			
			comparand.y = border;
			comparand.x = this.vertBaseline - comparand.vertBaseline;
			
			let hOffset = 0;
			if (border + comparand.vertBaseline > this.vertBaseline) {
				hOffset = border + comparand.vertBaseline - this.vertBaseline;
				
				this.vertBaseline += hOffset;
				this.width += hOffset;
				comparand.x += hOffset;
			}
			
			if (this.vertBaseline + comparand.width - comparand.vertBaseline + border > this.width) {
				this.width += this.vertBaseline + comparand.width - comparand.vertBaseline + border - this.width;
			}
			
			let vOffset = border + comparand.height + border + 10;
			
			for (let i = 1, n = this.children.length; i < n; ++i) {
				this.children[i].x += hOffset;
				this.children[i].y += vOffset;
			}
			
			this.height += vOffset;
			this.horzBaseline += vOffset;
		}
	}
	
	display(context, x, y) {
		if (Programming.codeStyle) {
			// switch
			
			let bkpBold = context.fontInfo.italic;
			context.fontInfo.setBold(context, true);
			
			super.drawText(context, Programming.messages.literalSwitch, x, y + this.children[0].horzBaseline + context.fontInfo.semiHeight);
			
			// cases
			
			let child;
			let cases = Math.floor((this.children.length - 1) / 2);
			
			for (let c = 0; c < cases; ++c) {
				child = this.children[2 * c + 2];
				
				super.drawText(context, Programming.messages.literalWhen, x + 30,           y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
				super.drawText(context, ":",                              x + child.x - 10, y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
			}
			
			// else (if any)
			
			if ((this.children.length % 2) == 0) {
				child = this.children[this.children.length - 1];
				super.drawText(context, Programming.messages.literalElse, x + 30, y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
			}
			
			// end switch
			
			super.drawText(context, Programming.messages.literalEndSwitch, x, y + this.height);
			
			context.fontInfo.setBold(context, bkpBold);
			
			// subexpressions
			
			for (let i = 0, n = this.children.length; i < n; ++i) {
				child = this.children[i];
				child.display(context, x + child.x, y + child.y);
			}
			
			// line
			let bkpStrokeStyle = context.strokeStyle;
			context.strokeStyle = "orange";
			context.beginPath();
			context.moveTo (x, y + this.children[0].horzBaseline + context.fontInfo.semiHeight + 5); // preventing obfuscation
			context.lineTo (x, y + this.height - context.fontInfo.size - 5);                         // preventing obfuscation
			context.stroke();
			context.strokeStyle = bkpStrokeStyle;
		}
		else { // workflow
			Programming.displaySwitchFlowchart(true, this, context, x, y);
			
			let comparand = this.children[0];
			let border = comparand.getTag() === "Null" ? 0 : 10;
			
			comparand.display(context, x + comparand.x, y + comparand.y);
			if (border > 0) {
				context.strokeRect(x + comparand.x - 10, y + comparand.y - 10, 10 + comparand.width + 10, 10 + comparand.height + 10);
			}
			
			context.beginPath();
			context.moveTo(x + comparand.x + comparand.vertBaseline, y + comparand.y + comparand.height + border);
			context.lineTo(x + comparand.x + comparand.vertBaseline, y + comparand.y + comparand.height + border + 10);
			context.stroke();
		}
	}
}

Programming.ConditionalSwitch = class extends Expression {
	getTag() { return "Programming.ConditionalSwitch"; }
	getName() { return Programming.messages.nameConditionalSwitch; }
	canHaveChildren(count) { return count >= 2; }
	
	prepareDisplay(context) {
		if (Programming.codeStyle) {
			let child;
			
			let bkpBold = context.fontInfo.italic;
			context.fontInfo.setBold(context, true);
			
			let v1 = Math.round(30 + context.measureText(Programming.messages.literalWhen).width + 10);
			let v2 = 0;
			
			// switch
			
			this.width = Math.round(context.measureText(Programming.messages.literalSwitch).width);
			this.height = context.fontInfo.size + 10;
			
			context.fontInfo.setBold(context, bkpBold);
			
			// cases
			
			let cases = Math.floor(this.children.length / 2);
			let child1, child2;
			
			for (let c = 0; c < cases; ++c) {
				(child1 = this.children[2 * c    ]).prepareDisplay(context);
				(child2 = this.children[2 * c + 1]).prepareDisplay(context);
				
				child1.x = v1;
				
				this.height += Math.max(child1.horzBaseline, child2.horzBaseline);
				child1.y = this.height - child1.horzBaseline;
				child2.y = this.height - child2.horzBaseline;
				this.height += Math.max(child1.height - child1.horzBaseline, child2.height - child2.horzBaseline);
				this.height += 10;
				
				if (child1.width > v2) v2 = child1.width;
			}
			
			v2 = v1 + v2 + 10 + 10;
			
			for (let c = 0; c < cases; ++c) {
				child2 = this.children[2 * c + 1];
				
				child2.x = v2;
				if (child2.x + child2.width > this.width) this.width = child2.x + child2.width;
			}
			
			// else (if any)
			
			if ((this.children.length % 2) != 0) {
				(child = this.children[this.children.length - 1]).prepareDisplay(context);
				
				child.y = this.height;
				this.height += child.height;
				this.height += 10;
				
				child.x = v1;
				if (child.x + child.width > this.width) this.width = child.x + child.width;
			}
			
			// end switch
			
			this.height += context.fontInfo.size;
			this.horzBaseline = context.fontInfo.semiHeight;
			this.vertBaseline = Math.round(this.width / 2);
		}
		else { // flowchart
			Programming.prepareDisplaySwitchFlowchart(false, this, context);
		}
	}
	
	display(context, x, y) {
		if (Programming.codeStyle) {
			// switch
			
			let bkpBold = context.fontInfo.italic;
			context.fontInfo.setBold(context, true);
			
			super.drawText(context, Programming.messages.literalSwitch, x, y + context.fontInfo.size);
			
			// cases
			
			let child;
			let cases = Math.floor(this.children.length / 2);
			
			for (let c = 0; c < cases; ++c) {
				child = this.children[2 * c + 1];
				
				super.drawText(context, Programming.messages.literalWhen, x + 30,           y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
				super.drawText(context, ":",                              x + child.x - 10, y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
			}
			
			// else (if any)
			
			if ((this.children.length % 2) != 0) {
				child = this.children[this.children.length - 1];
				super.drawText(context, Programming.messages.literalElse, x + 30, y + child.y + child.horzBaseline + context.fontInfo.semiHeight);
			}
			
			// end switch
			
			super.drawText(context, Programming.messages.literalEndSwitch, x, y + this.height);
			
			context.fontInfo.setBold(context, bkpBold);
			
			// subexpressions
			
			for (let i = 0, n = this.children.length; i < n; ++i) {
				child = this.children[i];
				child.display(context, x + child.x, y + child.y);
			}
			
			// line
			let bkpStrokeStyle = context.strokeStyle;
			context.strokeStyle = "orange";
			context.beginPath();
			context.moveTo (x, y + context.fontInfo.size + 5);               // preventing obfuscation
			context.lineTo (x, y + this.height - context.fontInfo.size - 5); // preventing obfuscation
			context.stroke();
			context.strokeStyle = bkpStrokeStyle;
		}
		else { // flowchart
			Programming.displaySwitchFlowchart(false, this, context, x, y);
		}
	}
}

Programming.setExpressions = function(module) {
	Formulae.setExpression(module, "Programming.Block",             Programming.CodeBlock);
	Formulae.setExpression(module, "Programming.Until",             Programming.UntilCode);
	Formulae.setExpression(module, "Programming.Conditional",       Programming.Conditional);
	Formulae.setExpression(module, "Programming.ComparativeSwitch", Programming.ComparativeSwitch);
	Formulae.setExpression(module, "Programming.ConditionalSwitch", Programming.ConditionalSwitch);
	Formulae.setExpression(module, "Programming.Cycle",             Programming.Cycle);
	
	// if-then, if-then-else & while
	[ "If", "IfElse", "While" ].forEach((tag, type) => Formulae.setExpression(module, "Programming." + tag, {
		clazz: Programming.IfWhileCode,
		type:  type
	}));
	
	// for
	[ "ForTimes", "ForFromTo", "ForIn" ].forEach((tag, type) => Formulae.setExpression(module, "Programming." + tag, {
		clazz: Programming.ForCode,
		type:  type
	}));
	
	// Inverted for
	[ "ForTimes", "ForFromTo", "ForIn" ].forEach((tag, type) => Formulae.setExpression(module, "Programming.Inverted" + tag, {
		clazz: Programming.InvertedFor,
		type:  type
	}));
	
	// cycle
	[ "CycleTimes", "CycleFromTo", "CycleIn" ].forEach((tag, type) => Formulae.setExpression(module, "Programming." + tag, {
		clazz: Programming.Cycle,
		type:  type
	}));
	
	// inverted if
	Formulae.setExpression(module, "Programming.InvertedIf", {
		clazz:        Expression.Infix,
		getTag:       ()    => "Programming.InvertedIf",
		getOperator:  ()    => Programming.messages.operatorInvertedIf,
		getName:      ()    => Programming.messages.nameInvertedIf,
		getChildName: index => Programming.messages.childrenInvertedIf[index],
		parentheses:  false,
		bold:         true,
		gap:          10,
		min: 2, max: 2
	});
};

Programming.isConfigurable = () => true;

Programming.onConfiguration = () => {
	let table = document.createElement("table");
	table.classList.add("bordered");
	let row = table.insertRow();
	let th = document.createElement("th"); th.setAttribute("colspan", "2"); th.appendChild(document.createTextNode("Programming")); row.appendChild(th);
	row = table.insertRow();
	let col = row.insertCell();
	col.appendChild(document.createTextNode("Style"));
	col = row.insertCell();
	
	let radio = document.createElement("input"); radio.type = "radio"; radio.addEventListener("click", () => Programming.onChangeStyle(true));
	col.appendChild(radio);
	col.appendChild(document.createTextNode("Code"));
	
	col.appendChild(document.createElement("br"));
	
	radio = document.createElement("input"); radio.type = "radio"; radio.addEventListener("click", () => Programming.onChangeStyle(false));
	col.appendChild(radio);
	col.appendChild(document.createTextNode("Flowchart"));
	
	Formulae.setModal(table);
};

Programming.onChangeStyle = function(codeStyle) {
	Formulae.resetModal();
	
	Programming.codeStyle = codeStyle;
	Formulae.refreshHandlers();
};
