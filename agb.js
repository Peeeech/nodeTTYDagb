//test func to print 4 raw bytes as hex:
    //console.log(`Bytes: ${view.getUint8(0).toString(16)} ${view.getUint8(1).toString(16)} ${view.getUint8(2).toString(16)} ${view.getUint8(3).toString(16)}`);

function parse(buffer) {
    const view = buffer.createDataView();
    
    //#region header
    //Read header size (4 bytes)
    const wHeaderSize = view.getUint32(0x00);

    // Read modelName (64 bytes from 0x04 to 0x44)
    let modelNameBytes = [];
    for (let i = 0x04; i < 0x44; i++) {
        const byte = view.getUint8(i);
        if (byte === 0) break;
        modelNameBytes.push(byte);
    }
    const modelName = String.fromCharCode(...modelNameBytes);

    // Read textureName (64 bytes from 0x44 to 0x84)
    let textureNameBytes = [];
    for (let i = 0x44; i < 0x84; i++) {
        const byte = view.getUint8(i);
        if (byte === 0) break;
        textureNameBytes.push(byte);
    }
    const textureName = String.fromCharCode(...textureNameBytes);

    // Read buildTime (64 bytes from 0x84 to 0xC4)
    let buildTimeBytes = [];
    for (let i = 0x84; i < 0xC3; i++) {
        const byte = view.getUint8(i);
        if (byte === 0) break;
        buildTimeBytes.push(byte);
    }
    const buildTime = String.fromCharCode(...buildTimeBytes);

    //Remaining header values (all 4 bytes a piece)
    const wFlags = view.getUint32(0xC4);
    const radius = view.getUint32(0xC8);
    const height = view.getUint32(0xCC);
    
    //Bounding box tuples
    const wBboxMin = [view.getFloat32(0xD0), view.getFloat32(0xD4), view.getFloat32(0xD8)];
    const wBboxMax = [view.getFloat32(0xDC), view.getFloat32(0xE0), view.getFloat32(0xE4)];

    //way too many 4byte variables
    const countBytes = {
        shapeCount: 0xE8,
        polygonCount: 0xEC,
        vertexPositionCount: 0xF0,
        vertexPositionIndexCount: 0xF4,
        vertexNormalCount: 0xF8,
        vertexNormalIndexCount: 0xFC,
        vertexColorCount: 0x100,
        vertexColorIndexCount: 0x104,
        vertexTextureCoordinate0IndexCount: 0x108,
        vertexTextureCoordinate1IndexCount: 0x10C,
        vertexTextureCoordinate2IndexCount: 0x110,
        vertexTextureCoordinate3IndexCount: 0x114,
        vertexTextureCoordinate4IndexCount: 0x118,
        vertexTextureCoordinate5IndexCount: 0x11C,
        vertexTextureCoordinate6IndexCount: 0x120,
        vertexTextureCoordinate7IndexCount: 0x124,
        vertexTextureCoordinateCount: 0x128,
        textureCoordinateTransformCount: 0x12C,
        samplerEntryTableCount: 0x130,
        textureTableCount: 0x134,
        subshapeCount: 0x138,
        visibilityGroupCount: 0x13C,
        groupTransformDataCount: 0x140,
        groupCount: 0x144,
        animCount: 0x148,
        pShapes: 0x14C,
        pPolygons: 0x150,
        pVertexPositions: 0x154,
        pVertexPositionIndices: 0x158,
        pVertexNormals: 0x15C,
        pVertexNormalIndices: 0x160,
        pVertexColors: 0x164,
        pVertexColorIndices: 0x168,
        pVertexTextureCoordinate0Indices: 0x16C,
        pVertexTextureCoordinate1Indices: 0x170,
        pVertexTextureCoordinate2Indices: 0x174,
        pVertexTextureCoordinate3Indices: 0x178,
        pVertexTextureCoordinate4Indices: 0x17C,
        pVertexTextureCoordinate5Indices: 0x180,
        pVertexTextureCoordinate6Indices: 0x184,
        pVertexTextureCoordinate7Indices: 0x188,
        pVertexTextureCoordinates: 0x18C,
        pTextureCoordinateTransforms: 0x190,
        pSamplers: 0x194,
        pTextures: 0x198,
        pSubshapes: 0x19C,
        pVisibilityGroups: 0x1A0,
        pGroupTransformData: 0x1A4,
        pGroups: 0x1A8,
        pAnims: 0x1AC,
    };
    let countValues = {};
    for (const [key, offset] of Object.entries(countBytes)) {
        countValues[key] = view.getUint32(offset);
    }
    const header = {wHeaderSize, modelName, textureName, buildTime, 
        wFlags, radius, height, wBboxMin, wBboxMax, countValues}
    //#endregion

    //#region shapes
    shapeOffs = 0x1B0;
    let shapes = [];
    //define each shape, looping over for each
    for (let i = 0; i < countValues.shapeCount; i++) {
        // Read shape name (64 bytes)
        let shapeNameBytes = [];
        for (let s = shapeOffs; s < (shapeOffs + 0x40); s++) {
            const byte = view.getUint8(s);
            if (byte === 0) break;
            shapeNameBytes.push(byte);
        }
        const name = String.fromCharCode(...shapeNameBytes);

        // Automatically calculate offsets for 4-byte values
        let offsetBase = shapeOffs + 0x40; // First 64 bytes are the name
        const shapeBytes = [
            "vertexPositionDataBaseIndex",
            "vertexPositionDataCount",
            "vertexNormalDataBaseIndex",
            "vertexNormalDataCount",
            "vertexColorDataBaseIndex",
            "vertexColorDataCount",
            "vertexTextureCoordinate0DataBaseIndex",
            "vertexTextureCoordinate0DataCount",
            "vertexTextureCoordinate1DataBaseIndex",
            "vertexTextureCoordinate1DataCount",
            "vertexTextureCoordinate2DataBaseIndex",
            "vertexTextureCoordinate2DataCount",
            "vertexTextureCoordinate3DataBaseIndex",
            "vertexTextureCoordinate3DataCount",
            "vertexTextureCoordinate4DataBaseIndex",
            "vertexTextureCoordinate4DataCount",
            "vertexTextureCoordinate5DataBaseIndex",
            "vertexTextureCoordinate5DataCount",
            "vertexTextureCoordinate6DataBaseIndex",
            "vertexTextureCoordinate6DataCount",
            "vertexTextureCoordinate7DataBaseIndex",
            "vertexTextureCoordinate7DataCount",
            "subshapeCount",
            "wDrawMode",
            "cullMode"
        ];
    
        let shapeData = {};
        for (const key of shapeBytes) {
            shapeData[key] = view.getUint32(offsetBase);
            offsetBase += 4; // Move to the next 4-byte block
        }
        //push data into shapes array
        shapes.push({ name, shapeData });
        //set offset for next shape
        shapeOffs += 0xA8;
    }
    //#endregion
    
    //#region polygons
    //start where shape offset left off; could re-use but easier to read this way
    polyOffs = shapeOffs;
    let polygons = [];

    //only 2 4-byte variables per polygon
    for (let i = 0; i < countValues.polygonCount; i++) {
        const vertexBaseIndex = view.getUint32(polyOffs);
        const vertexCount = view.getUint32(polyOffs + 0x04)
    
        polygons.push({vertexBaseIndex, vertexCount});
        polyOffs += 0x08;
    }
    //#endregion

    //#region vertexPositions
    vPosOffs = polyOffs;
    let vertexPositions = [];

    //every obj is an (x, y, z) tuple
    for (let i = 0; i < countValues.vertexPositionCount; i++) {
        const x = view.getFloat32(vPosOffs);
        const y = view.getFloat32(vPosOffs + 0x04);
        const z = view.getFloat32(vPosOffs + 0x08);

        vertexPositions.push({x, y, z});
        vPosOffs += 0x0C;
    }
    //#endregion

    //#region vertexPositionIndices
    vPosIndOffs = vPosOffs;
    let vertexPositionIndices = [];

    //every obj is a single 4 byte value
    for (let i = 0; i < countValues.vertexPositionIndexCount; i++) {
        const idx = view.getUint32(vPosIndOffs);

        vertexPositionIndices.push({idx});
        vPosIndOffs += 0x04;
    }
    //#endregion

    //#region vertexNormals
    vNorOffs = vPosIndOffs;
    let vertexNormals = [];

    //every obj is an (x, y, z) tuple
    for (let i = 0; i < countValues.vertexNormalCount; i++) {
        const x = view.getFloat32(vNorOffs);
        const y = view.getFloat32(vNorOffs + 0x04);
        const z = view.getFloat32(vNorOffs + 0x08);

        vertexNormals.push({x, y, z});
        vNorOffs += 0x0C;
    }
    //#endregion

    //#region vertexNormalIndices
    vNorIndOffs = vNorOffs;
    let vertexNormalIndices = [];

    //every obj is a single 4 byte value
    for (let i = 0; i < countValues.vertexNormalIndexCount; i++) {
        const idx = view.getUint32(vNorIndOffs);

        vertexNormalIndices.push({idx});
        vNorIndOffs += 0x04;
    }
    //#endregion

    //#region vertexColors
    vColOffs = vNorIndOffs;
    let vertexColors = [];

    //every obj is an (x, y, z) tuple
    for (let i = 0; i < countValues.vertexColorCount; i++) {
        const r = view.getUint8(vColOffs);
        const g = view.getUint8(vColOffs + 0x01);
        const b = view.getUint8(vColOffs + 0x02);
        const a = view.getUint8(vColOffs + 0x03);

        vertexColors.push({r, g, b, a});
        vColOffs += 0x04;
    }
    //#endregion

    //#region vertexColorIndices
    vColIndOffs = vColOffs;
    let vertexColorIndices = [];

    //every obj is a single 4 byte value
    for (let i = 0; i < countValues.vertexColorIndexCount; i++) {
        const idx = view.getUint32(vColIndOffs);

        vertexColorIndices.push({idx});
        vColIndOffs += 0x04;
    }
    //#endregion

    //#region vertexTextureCoordinateIndices
    vTexCorIndOffs = vColIndOffs;
    let vertexTextureCoordinate0Indices = [];

    //every obj is a single 4 byte value
    for (let i = 0; i < countValues.vertexTextureCoordinate0IndexCount; i++) {
        const idx = view.getUint32(vTexCorIndOffs);

        vertexTextureCoordinate0Indices.push({idx});
        vTexCorIndOffs += 0x04;
    }
    //#endregion

    //#region vertexTextureCoordinates
    vTexCorOffs = vTexCorIndOffs;
    let vertexTextureCoordinates = [];
    //every obj is an (x, y) tuple
    for (let i = 0; i < countValues.vertexTextureCoordinateCount; i++) {
        const x = view.getFloat32(vTexCorOffs);
        const y = view.getFloat32(vTexCorOffs + 0x04);

        vertexTextureCoordinates.push({x, y});
        vTexCorOffs += 0x08;
    }
    //#endregion

    //#region textureCoordinateTransforms
    texCorOffs = vTexCorOffs;
    let textureCoordinateTransforms = [];
    //every object has a framOffset, 3 padding bytes, then translation, scale, and rotation
    for (let i = 0; i < countValues.textureCoordinateTransformCount; i++) {
        const textureFrameOffset = view.getUint8(texCorOffs);
        //skip 3 bytes for padding (jump to 0x04)
        const translation = [view.getFloat32(texCorOffs + 0x04), view.getFloat32(texCorOffs + 0x08)];
        const scale = [view.getFloat32(texCorOffs + 0x0C), view.getFloat32(texCorOffs + 0x10)];
        const rotation = view.getFloat32(texCorOffs + 0x14);

        textureCoordinateTransforms.push({textureFrameOffset, translation, scale, rotation});
        texCorOffs += 0x18;
    }
    //#endregion

    //#region samplers
    sampOffs = texCorOffs;
    let samplers = [];
    //every object is 2 uint32 variables
    for (let i = 0; i < countValues.samplerEntryTableCount; i++) {
        const textureBaseId = view.getUint32(sampOffs);
        const wrapFlags = view.getUint32(sampOffs + 0x04);

        samplers.push({textureBaseId, wrapFlags});
        sampOffs += 0x08;
    }
    //#endregion

    //#region textures
    texOffs = sampOffs;
    let textures = [];
    //every object has a tpl index var, and (i assume) the original path for the texture file,
    //though in the 010 template it's unk_c[44], so i'm not sure on that
    for (let i = 0; i < countValues.textureTableCount; i++) {
        const unk_0 = view.getUint32(texOffs);
        const tplIndex = view.getUint32(texOffs + 0x04);
        const wbUnused = view.getUint32(texOffs + 0x08);

        // Read unk_c (44 bytes)
        let unkStringOffs = texOffs + 0x0C;
        let unkStringBytes = [];
        for (let j = unkStringOffs; j < (unkStringOffs + 0x2C); j++) {
            const byte = view.getUint8(j);
            if (byte === 0) break;
            unkStringBytes.push(byte);
        }
        const unk_c = String.fromCharCode(...unkStringBytes);
        //next two 4byte vars grouped together, but unknown
        const unk_38 = [view.getUint32(texOffs + 0x38), view.getUint32(texOffs + 0x3C)];

        textures.push({unk_0, tplIndex, wbUnused, unk_c, unk_38});
        texOffs += 0x40;
    }
    //#endregion

    //#region subshapes
    subOffs = texOffs;
    let subshapes = [];
    for (let i = 0; i < countValues.subshapeCount; i++) {
        const samplerCount = view.getUint32(subOffs);
        const unk_04 = view.getUint32(subOffs + 0x04);
        const tevMode = view.getUint32(subOffs + 0x08);
        const unk_0c = view.getUint32(subOffs + 0x0C);
        const samplerIndices = [
            view.getInt32(subOffs + 0x10),
            view.getInt32(subOffs + 0x14),
            view.getInt32(subOffs + 0x18),
            view.getInt32(subOffs + 0x1C),
            view.getInt32(subOffs + 0x20),
            view.getInt32(subOffs + 0x24),
            view.getInt32(subOffs + 0x28),
            view.getInt32(subOffs + 0x2C)
        ]
        const samplerSourceTextureCoordinateIndices = [
            view.getInt8(subOffs + 0x30),
            view.getInt8(subOffs + 0x31),
            view.getInt8(subOffs + 0x32),
            view.getInt8(subOffs + 0x33),
            view.getInt8(subOffs + 0x34),
            view.getInt8(subOffs + 0x35),
            view.getInt8(subOffs + 0x36),
            view.getInt8(subOffs + 0x37)
        ]
        const polygonBaseIndex = view.getUint32(subOffs + 0x38);
        const polygonCount = view.getUint32(subOffs + 0x3C);
        const vertexPositionIndicesBaseIndex = view.getUint32(subOffs + 0x40);
        const vertexNormalBaseIndicesBaseIndex = view.getUint32(subOffs + 0x44);
        const vertexColorBaseIndicesBaseIndex = view.getUint32(subOffs + 0x48);
        const vertexTextureCoordinateIndicesBaseIndex = [
            view.getUint32(subOffs + 0x4C),
            view.getUint32(subOffs + 0x50),
            view.getUint32(subOffs + 0x54),
            view.getUint32(subOffs + 0x58),
            view.getUint32(subOffs + 0x5C),
            view.getUint32(subOffs + 0x60),
            view.getUint32(subOffs + 0x64),
            view.getUint32(subOffs + 0x68)
        ]

        subshapes.push({ samplerCount, unk_04, tevMode, unk_0c, samplerIndices, samplerSourceTextureCoordinateIndices, polygonBaseIndex, polygonCount, vertexPositionIndicesBaseIndex, vertexNormalBaseIndicesBaseIndex, vertexColorBaseIndicesBaseIndex, vertexTextureCoordinateIndicesBaseIndex })
        subOffs += 0x6C;
    }
    //#endregion

    //#region visibilityGroups
    visOffs = subOffs;
    let visibilityGroups = [];

    for (let i = 0; i < countValues.visibilityGroupCount; i++) {
    visibilityGroups.push(view.getUint8(visOffs));
    visOffs += 0x01;
    }
    //#endregion


    //#region groupTransformData
    gTraOffs = (visOffs + 3) & ~3; // Align to next 4-byte boundary, since visGroups doesn't always align properly
    let groupTransformData = [];

    for (let i = 0; i < (countValues.groupTransformDataCount / 24); i++) { //could just use groupCount, but this number should work in every case afaik
        const translation = [view.getFloat32(gTraOffs), view.getFloat32(gTraOffs + 0x04), view.getFloat32(gTraOffs + 0x08)];
        const scale = [view.getFloat32(gTraOffs + 0x0C), view.getFloat32(gTraOffs + 0x10), view.getFloat32(gTraOffs + 0x14)];
        const rotationIn2Deg = [view.getFloat32(gTraOffs + 0x18), view.getFloat32(gTraOffs + 0x1C), view.getFloat32(gTraOffs + 0x20)];
        const joinPostRotationInDeg = [view.getFloat32(gTraOffs + 0x24), view.getFloat32(gTraOffs + 0x28), view.getFloat32(gTraOffs + 0x2C)];
        const transformRotationPivot = [view.getFloat32(gTraOffs + 0x30), view.getFloat32(gTraOffs + 0x34), view.getFloat32(gTraOffs + 0x38)];
        const transformScalePivot = [view.getFloat32(gTraOffs + 0x3C), view.getFloat32(gTraOffs + 0x40), view.getFloat32(gTraOffs + 0x44)];
        const transformRotationOffset = [view.getFloat32(gTraOffs + 0x48), view.getFloat32(gTraOffs + 0x4C), view.getFloat32(gTraOffs + 0x50)];
        const transformScaleOffset = [view.getFloat32(gTraOffs + 0x54), view.getFloat32(gTraOffs + 0x58), view.getFloat32(gTraOffs + 0x5C)];

        groupTransformData.push({translation, scale, rotationIn2Deg, joinPostRotationInDeg, transformRotationPivot, transformScalePivot, transformRotationOffset, transformScaleOffset})
        gTraOffs += 0x60;
    }
    //#endregion

    //#region groups
    groupOffs = gTraOffs;
    let groups = [];

    for (let i = 0; i < (countValues.groupCount); i++) {
        // Read group name (64 bytes)
        let groupNameBytes = [];
        for (let j = groupOffs; j < groupOffs + 0x40; j++) {
            const byte = view.getUint8(j);
            if (byte === 0) break;
            groupNameBytes.push(byte);
        }
        const name = String.fromCharCode(...groupNameBytes);

        const nextGroupId = view.getInt32(groupOffs + 0x40);
        const childGroupId = view.getInt32(groupOffs + 0x44);
        const shapeId = view.getInt32(groupOffs + 0x48);
        const visibilityGroupId = view.getUint32(groupOffs + 0x4C);
        const transformBaseIndex = view.getUint32(groupOffs + 0x50);
        const bIsJoint = view.getUint32(groupOffs + 0x54);// if not transform, joint

        groups.push({name, nextGroupId, childGroupId, shapeId, visibilityGroupId, transformBaseIndex, bIsJoint})
        groupOffs += 0x58;
    }
    //#endregion

    //#region anims
    animOffs = groupOffs;
    let anims = [];

    for (let i = 0; i < (countValues.animCount); i++) {
        // Read anim name (16 bytes)
        let animNameBytes = [];
        for (let j = animOffs; j < animOffs + 0x10; j++) {
            const byte = view.getUint8(j);
            if (byte === 0) break;
            animNameBytes.push(byte);
        }
        const name = String.fromCharCode(...animNameBytes);
        //44 padding bytes; skipped
        const dataOffset = view.getUint32(animOffs + 0x3C);
        let data = {
            datasize: view.getUint32(dataOffset),
            baseInfoCount: view.getUint32(dataOffset + 0x04),
            keyframeCount: view.getUint32(dataOffset + 0x08),
            vertexPositionDeltaCount: view.getUint32(dataOffset + 0x0C),
            vertexNormalDeltaCount: view.getUint32(dataOffset + 0x10),
            textureCoordinateTransformDeltaCount: view.getUint32(dataOffset + 0x14),
            visibilityGroupDeltaCount: view.getUint32(dataOffset + 0x18),
            groupTransformDataDeltaCount: view.getUint32(dataOffset + 0x1C),
            wAnimDataType8Count: view.getUint32(dataOffset + 0x20),
            pBaseInfo: view.getUint32(dataOffset + 0x24),
            pKeyframes: view.getUint32(dataOffset + 0x28),
            pVertexPositionDeltas: view.getUint32(dataOffset + 0x2C),
            pVertexNormalDeltas: view.getUint32(dataOffset + 0x30),
            pTextureCoordinateTransformDeltas: view.getUint32(dataOffset + 0x34),
            pVisibilityGroupDeltas: view.getUint32(dataOffset + 0x38),
            pGroupTransformDataDeltas: view.getUint32(dataOffset + 0x3C),
            wpAnimDataType8Data: view.getUint32(dataOffset + 0x40),
            unk_44: [
                view.getFloat32(dataOffset + 0x44),
                view.getFloat32(dataOffset + 0x48),
                view.getFloat32(dataOffset + 0x4C),
                view.getFloat32(dataOffset + 0x50),
                view.getFloat32(dataOffset + 0x54),
                view.getFloat32(dataOffset + 0x58),
            ],
            baseInfo: {
                bLoop: view.getUint32(dataOffset + 0x5C),
                animStart: view.getFloat32(dataOffset + 0x60),
                animEnd: view.getFloat32(dataOffset + 0x64),
            },
            keyframes: [],
            groupTransformDataDeltas: []
        };        

        keyOffs = dataOffset + 0x68
        for (let k = 0; k < data.keyframeCount; k++) {
            const time = view.getFloat32(keyOffs);
            const vertexPositionDeltaBaseIndex = view.getUint32(keyOffs + 0x04);
            const vertexPositionDeltaCount = view.getUint32(keyOffs + 0x08);
            const vertexNormalDeltaBaseIndex = view.getUint32(keyOffs + 0x0C);
            const vertexNormalDeltaCount = view.getUint32(keyOffs + 0x10);
            const textureCoordinateTransformDeltaBaseIndex = view.getUint32(keyOffs + 0x14);
            const textureCoordinateTransformDeltaCount = view.getUint32(keyOffs + 0x18);
            const visibilityGroupDeltaBaseIndex = view.getUint32(keyOffs + 0x1C);
            const visibilityGroupDeltaCount = view.getUint32(keyOffs + 0x20);
            const groupTransformDataDeltaBaseIndex = view.getUint32(keyOffs + 0x24);
            const groupTransformDataDeltaCount = view.getUint32(keyOffs + 0x28);

            data.keyframes.push({time, vertexPositionDeltaBaseIndex, vertexPositionDeltaCount, vertexNormalDeltaBaseIndex, vertexNormalDeltaCount, textureCoordinateTransformDeltaBaseIndex, textureCoordinateTransformDeltaCount,visibilityGroupDeltaBaseIndex, visibilityGroupDeltaCount, groupTransformDataDeltaBaseIndex, groupTransformDataDeltaCount })
            keyOffs += 0x2C;
        }

        deltaOffs = keyOffs;
        for (let d = 0; d < data.groupTransformDataDeltaCount; d++) {
            indexDelta = view.getUint8(deltaOffs);
            valueDelta = view.getUint8(deltaOffs + 0x01);
            tangentInDeg = view.getUint8(deltaOffs + 0x02);
            tangentOutDeg = view.getUint8(deltaOffs + 0x03);

            data.groupTransformDataDeltas.push({indexDelta, valueDelta, tangentInDeg, tangentOutDeg});
            deltaOffs += 0x04;
        }
        
        anims.push({ name, dataOffset, data })
        animOffs += 0x40;
    }
    //#endregion

    return { header, shapes, polygons, vertexPositions, vertexPositionIndices, vertexNormals, vertexNormalIndices, vertexColors, vertexColorIndices, vertexTextureCoordinate0Indices, textureCoordinateTransforms, samplers, textures, subshapes, visibilityGroups, groupTransformData, groups, anims }
}

//region Buffer handling (Noclip)
//====================== util =======================================
function assert(b, message) {
    if (!b) {
        console.error(new Error().stack);
        throw 'Assert fail: '+message;
    }
}

// The field name `arrayBuffer` is chosen so that someone can't easily mistake an ArrayBufferSlice
// for an ArrayBuffer or ArrayBufferView, which is important for native APIs like OpenGL that
// will silently choke on something like this.
function newArrayBufferSlice(arrayBuffer, byteOffset = 0, byteLength = arrayBuffer.byteLength - byteOffset) {
    //arrayBuffer: ArrayBufferLike
    var o = Object.assign({}, ArrayBufferSlice);
    o.arrayBuffer = arrayBuffer;
    o.byteOffset = byteOffset;
    o.byteLength = byteLength;
    assert(byteOffset >= 0 && byteLength >= 0 && (byteOffset + byteLength) <= o.arrayBuffer.byteLength);
    return o;
}

var ArrayBufferSlice = {
    destroy() {
        this.arrayBuffer = null;
    },
    slice(begin, end = 0, copyData = false) {
        //begin: number
        //returns ArrayBufferSlice
        const absBegin = this.byteOffset + begin;
        const absEnd = this.byteOffset + (end !== 0 ? end : this.byteLength);
        const byteLength = absEnd - absBegin;
        assert(byteLength >= 0 && byteLength <= this.byteLength);
        if (copyData)
            return newArrayBufferSlice(ArrayBuffer_slice.call(this.arrayBuffer, absBegin, absEnd));
        else
            return newArrayBufferSlice(this.arrayBuffer, absBegin, byteLength);
    },
    subarray(begin, byteLength, copyData = false) {
        const absBegin = this.byteOffset + begin;
        if (byteLength === undefined)
            byteLength = this.byteLength - begin;
        assert(byteLength >= 0 && byteLength <= this.byteLength);
        if (copyData)
            return newArrayBufferSlice(ArrayBuffer_slice.call(this.arrayBuffer, absBegin, absBegin + byteLength));
        else
            return newArrayBufferSlice(this.arrayBuffer, absBegin, byteLength);
    },
    copyToBuffer(begin = 0, byteLength = 0) {
        const start = this.byteOffset + begin;
        const end = byteLength !== 0 ? start + byteLength : this.byteOffset + this.byteLength;
        return ArrayBuffer_slice.call(this.arrayBuffer, start, end);
    },
    createDataView(offs = 0, length) {
        //: DataView
        if (offs === 0 && length === undefined) {
            return new DataView(this.arrayBuffer, this.byteOffset, this.byteLength);
        } else {
            return this.subarray(offs, length).createDataView();
        }
    },
    bswap16() {
        assert(this.byteLength % 2 === 0);
        const a = this.createTypedArray(Uint8Array);
        const o = new Uint8Array(this.byteLength);
        for (let i = 0; i < a.byteLength; i += 2) {
            o[i+0] = a[i+1];
            o[i+1] = a[i+0];
        }
        return newArrayBufferSlice(o.buffer);
    },
    bswap32() {
        assert(this.byteLength % 4 === 0);
        const a = this.createTypedArray(Uint8Array);
        const o = new Uint8Array(a.byteLength);
        for (let i = 0; i < a.byteLength; i += 4) {
            o[i+0] = a[i+3];
            o[i+1] = a[i+2];
            o[i+2] = a[i+1];
            o[i+3] = a[i+0];
        }
        return newArrayBufferSlice(o.buffer);
    },
    bswap(componentSize) {
        if (componentSize === 2) {
            return this.bswap16();
        } else if (componentSize === 4) {
            return this.bswap32();
        } else {
            throw new Error("Invalid componentSize");
        }
    },
    convertFromEndianness(endianness, componentSize) {
        if (componentSize !== 1 && endianness !== getSystemEndianness())
            return this.bswap(componentSize);
        else
            return this;
    },
    createTypedArray(clazz, offs = 0, count, endianness = Endianness.LITTLE_ENDIAN) {
        //createTypedArray<T extends ArrayBufferView>(clazz: _TypedArrayConstructor<T>, offs: number = 0, count?: number, endianness: Endianness = Endianness.LITTLE_ENDIAN): T
        const begin = this.byteOffset + offs;

        let byteLength;
        if (count !== undefined) {
            byteLength = clazz.BYTES_PER_ELEMENT * count;
        } else {
            byteLength = this.byteLength - offs;
            count = byteLength / clazz.BYTES_PER_ELEMENT;
            assert((count | 0) === count);
        }

        const componentSize = clazz.BYTES_PER_ELEMENT;
        const needsEndianSwap = (componentSize > 1) && (endianness !== getSystemEndianness());

        // Typed arrays require alignment.
        if (needsEndianSwap) {
            const componentSize_ = componentSize;
            const copy = this.subarray(offs, byteLength).bswap(componentSize_);
            return copy.createTypedArray(clazz);
        } else if (isAligned(begin, componentSize)) {
            return new clazz(this.arrayBuffer, begin, count);
        } else {
            return new clazz(this.copyToBuffer(offs, byteLength), 0);
        }
    }
};

module.exports = {
    parse,
    newArrayBufferSlice
};