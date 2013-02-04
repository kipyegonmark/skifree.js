(function (global) {
	var GUID = require('./lib/guid');
	function Sprite (data) {
		var hittableObjects = {};
		var that = this;
		if (data && data.id) that.id = data.id;
		else that.id = GUID();
		that.x = 0;
		that.y = 0;
		that.height = 0;
		that.speed = 3;
		that.data = data || { parts : {} };
		that.movingToward = [ 0, 0 ];
		that.metresDownTheMountain = 0;
		that.movingWithConviction = false;
		that.deleted = false;
		that.maxHeight = (function () {
			return Object.values(that.data.parts).map(function (p) { return p[3]; }).max();
		}());

		function incrementX(amount) {
			that.x += amount.toNumber();
		}

		function incrementY(amount) {
			that.y += amount.toNumber();
		}

		this.draw = function draw (dCtx, spriteFrame) {
			var fr = that.data.parts[spriteFrame];
			that.height = fr[3];
			that.width = fr[2];
			dCtx.drawImage(dCtx.getLoadedImage(that.data.$imageFile), fr[0], fr[1], fr[2], fr[3], that.x, that.y, fr[2], fr[3]);
		};

		this.setPosition = function setPosition (cx, cy) {
			if (cx) {
				if (Object.isString(cx) && (cx.first() === '+' || cx.first() === '-')) incrementX(cx);
				else that.x = cx;
			}
			
			if (cy) {
				if (Object.isString(cy) && (cy.first() === '+' || cy.first() === '-')) incrementY(cy);
				else that.y = cy;
			}
		};

		this.getXPosition = function getXPosition () {
			return that.x;
		};

		this.getYPosition = function getYPosition () {
			return that.y;
		};

		this.getLeftEdge = this.getXPosition;

		this.getTopEdge = this.getYPosition;

		this.getRightEdge = function getRightEdge () {
			return that.x + that.width;
		};

		this.getBottomEdge = function getBottomEdge () {
			return that.y + that.height;
		};

		this.getPositionInFrontOf = function getPositionInFrontOf () {
			return [that.x, that.y + that.height];
		};

		this.setSpeed = function setSpeed (s) {
			that.speed = s;
		};

		that.getSpeed = function getSpeed () {
			return that.speed;
		};

		this.setHeight = function setHeight (h) {
			that.height = h;
		};

		this.setWidth = function setHeight (w) {
			that.width = w;
		};

		this.getMaxHeight = function getMaxHeight() {
			return that.maxHeight;
		};

		that.getMovingTowardOpposite = function () {
			if (!that.isMoving) {
				return [0, 0];
			}

			var dx = (that.movingToward[0] - that.getXPosition());
			var dy = (that.movingToward[1] - that.getYPosition());

			var oppositeX = (Math.abs(dx) > 75 ? 0 - dx : 0);
			var oppositeY = -dy;

			return [ oppositeX, oppositeY ];
		};

		this.cycle = function () {
			Object.keys(hittableObjects, function (k, objectData) {
				if (objectData.object.deleted) {
					delete hittableObjects[k];
				} else {
					if (that.hits(objectData.object)) {
						objectData.callbacks.each(function (callback) {
							callback(that, objectData.object);
						});
					}
				}
			});
		};

		this.move = function move () {
			if (typeof that.movingToward[0] !== 'undefined') {
				if (that.x > that.movingToward[0]) {
					that.x -= Math.min(that.speed, Math.abs(that.x - that.movingToward[0]));
				} else if (that.x < that.movingToward[0]) {
					that.x += Math.min(that.speed, Math.abs(that.x - that.movingToward[0]));
				}
			}
			
			if (typeof that.movingToward[1] !== 'undefined') {
				if (that.y > that.movingToward[1]) {
					that.y -= Math.min(that.speed, Math.abs(that.y - that.movingToward[1]));
				} else if (that.y < that.movingToward[1]) {
					that.y += Math.min(that.speed, Math.abs(that.y - that.movingToward[1]));
				}
			}
		};

		this.moveToward = function moveToward (cx, cy, override) {
			if (override) {
				that.movingWithConviction = false;
			}

			if (!that.movingWithConviction) {
				that.movingToward = [ cx, cy ];

				that.movingWithConviction = false;
			}

			that.move();
		};

		this.moveAwayFromSprite = function (otherSprite) {
			var opposite = otherSprite.getMovingTowardOpposite();
			that.setSpeed(otherSprite.getSpeed());

			var moveTowardX = that.getXPosition() + opposite[0];
			var moveTowardY = that.getYPosition() + opposite[1];

			that.moveToward(moveTowardX, moveTowardY);
		};

		this.moveTowardWithConviction = function moveToward (cx, cy) {
			that.moveToward(cx, cy);
			that.movingWithConviction = true;
		};

		this.onHitting = function (objectToHit, callback) {
			if (hittableObjects[objectToHit.id]) {
				return hittableObjects[objectToHit.id].callbacks.push(callback);
			}

			hittableObjects[objectToHit.id] = {
				object: objectToHit,
				callbacks: [ callback ]
			};
		};

		this.deleteOnNextCycle = function () {
			that.deleted = true;
		};

		this.hits = function hits (other) {
			var verticalIntersect = false;
			var horizontalIntersect = false;

			// Test that THIS has a bottom edge inside of the other object
			if (other.getTopEdge() <= that.getBottomEdge() && other.getBottomEdge() >= that.getBottomEdge()) {
				verticalIntersect = true;
			}

			// Test that THIS has a top edge inside of the other object
			if (other.getTopEdge() <= that.getTopEdge() && other.getBottomEdge() >= that.getTopEdge()) {
				verticalIntersect = true;
			}

			// Test that THIS has a right edge inside of the other object
			if (other.getLeftEdge() <= that.getRightEdge() && other.getRightEdge() >= that.getRightEdge()) {
				horizontalIntersect = true;
			}

			// Test that THIS has a left edge inside of the other object
			if (other.getLeftEdge() <= that.getLeftEdge() && other.getRightEdge() >= that.getLeftEdge()) {
				horizontalIntersect = true;
			}

			return verticalIntersect && horizontalIntersect;
		};

		this.isAbove = function (cy) {
			return (that.y + that.height) < cy;
		};

		return that;
	}

	global.Sprite = Sprite;
})( this );


if (typeof module !== 'undefined') {
	module.exports = this.Sprite;
}