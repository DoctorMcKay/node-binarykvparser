var Long = require('long');

var Type = {
	None: 0,
	String: 1,
	Int32: 2,
	Float32: 3,
	Pointer: 4,
	WideString: 5,
	Color: 6,
	UInt64: 7,
	End: 8
};

exports.parse = function(buffer, offset) {
	if (buffer.toBuffer) {
		// Convert it to a standard Buffer if it's a ByteBuffer
		buffer = buffer.toBuffer();
	}
	
	var obj = {};
	var type, name, value;
	
	if (typeof offset === 'undefined') {
		offset = [0];
	}
	
	if (!(offset instanceof Array)) {
		offset = [offset]; // turn this into an array because it needs to be passed by reference later :/
	}
	
	while (true) {
		type = buffer.readUInt8(offset[0]);
		offset[0] += 1;
		
		if (type == Type.End) {
			break;
		}
		
		name = readCString();
		
		switch (type) {
			case Type.None:
				if (obj.hasOwnProperty(name)) {
					value = obj[name];
				} else {
					value = exports.parse(buffer, offset);
				}
				break;
			
			case Type.String:
				value = readCString();
				break;
			
			case Type.Int32:
			case Type.Color:
			case Type.Pointer:
				value = buffer.readInt32LE(offset[0]);
				offset[0] += 4;
				break;
			
			case Type.UInt64:
				value = new Long(buffer.readUInt32LE(offset[0]), buffer.readUInt32LE(offset[0] + 4), true);
				offset[0] += 8;
				break;
			
			case Type.Float32:
				value = buffer.readFloatLE(offset[0]);
				offset[0] += 4;
				break;
			
			default:
				throw new Error("Unknown KV type " + type + " encountered at offset " + offset[0]);
		}
		
		if (name !== undefined) {
	    obj[name] = convertObject(value);
	  }
	}
	
	return obj;
	
	function readCString() {
		var end = buffer.indexOf(0, offset[0]);
		var str = buffer.toString('utf8', offset[0], end);
		offset[0] = end + 1;
		return str;
	}
}

/**
 * Converts an object to an array if it's an array-like object
 * @param Object obj
 * @returns Object|Array
 */
function convertObject(obj) {
	if (typeof obj !== 'object') {
		return obj;
	}

	var keys = Object.keys(obj);

	var i;
	for (i = 0; i < keys.length; i++) {
		keys[i] = parseInt(keys[i], 10);
		if (isNaN(keys[i])) {
			return obj;
		}
	}

	keys.sort(function(a, b) {
		if (a == b) {
			return 0;
		} else {
			return a < b ? -1 : 1;
		}
	});

	for (i = 0; i < keys.length; i++) {
		if(keys[i] != i) {
			return obj;
		}
	}

	obj.length = keys.length;
	return Array.prototype.slice.call(obj);
}
