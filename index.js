var ByteBuffer = require('bytebuffer');

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

exports.parse = function(buffer) {
	if(!ByteBuffer.isByteBuffer(buffer)) {
		buffer = ByteBuffer.wrap(buffer, 'utf8', true);
	}
	
	var obj = {};
	var type, name, value;
	
	while(true) {
		type = buffer.readByte();
		
		if(type == Type.End) {
			break;
		}
		
		name = buffer.readCString();
		
		if(type === Type.None && !name && !Object.keys(obj).length) {
			// Root node
			name = buffer.readCString();
		}
		
		switch(type) {
			case Type.None:
				value = exports.parse(buffer);
				break;
			
			case Type.String:
				value = buffer.readCString();
				break;
			
			case Type.Int32:
			case Type.Color:
			case Type.Pointer:
				value = buffer.readInt32();
				break;
			
			case Type.UInt64:
				value = buffer.readUint64();
				break;
			
			case Type.Float32:
				value = buffer.readFloat32();
				break;
			
			default:
				throw new Error("Unknown KV type " + type + " encountered at offset " + buffer.offset);
		}
		
		if(name) {
			obj[name] = value;
		}
	}
	
	return obj;
}
