import {imageService} from './services/image_service';
import {VideoHandler} from './video_handler';
import {DetectorService} from './services/detector_service';
import {VideoPlayer} from './player/player';

export const canvasHandler = {
    // { entityName: program, imgTexture }
    drawnImages: {},

    attachShader: function (params) {
        this.fragmentShader = this.getShaderByName(params.fragmentShaderName);
        this.vertexShader = this.getShaderByName(params.vertexShaderName);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);

        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.program));
        }

        this.gl.useProgram(this.program);

        // get the location of attributes and uniforms
        this.attributes = {};

        for (var i = 0; i < params.attributes.length; i++) {
            var attributeName = params.attributes[i];
            this.attributes[attributeName] = this.gl.getAttribLocation(this.program, attributeName);
            this.gl.enableVertexAttribArray(this.attributes[attributeName]);
        }

        this.uniforms = {};

        for (i = 0; i < params.uniforms.length; i++) {
            var uniformName = params.uniforms[i];
            this.uniforms[uniformName] = this.gl.getUniformLocation(this.program, uniformName);

            this.gl.enableVertexAttribArray(this.attributes[uniformName]);
        }
    },

    getShaderByName: function (id) {
        var shaderScript = document.getElementById(id);

        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while (currentChild) {
            if (currentChild.nodeType === 3) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }

        var result;

        if (shaderScript.type === "x-shader/x-fragment") {
            result = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        } else {
            result = this.gl.createShader(this.gl.VERTEX_SHADER);
        }

        this.gl.shaderSource(result, theSource);
        this.gl.compileShader(result);

        if (!this.gl.getShaderParameter(result, this.gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(result));
            return null;
        }
        return result;
    },

    initShader: function () {
        this.attachShader({
            fragmentShaderName: 'shader-fs',
            vertexShaderName: 'shader-vs',
            attributes: ['aVertexPosition'],
            uniforms: ['someVal', 'uSampler'],
        });

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clearDepth(1.0);
        this.gl.disable(this.gl.DEPTH_TEST);

        this.positionsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionsBuffer);

        var positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        var vertexColors = [0xff00ff88, 0xffffffff];

        var cBuffer = this.gl.createBuffer();

        this.verticesIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);

        var vertexIndices = [0, 1, 2, 0, 2, 3,];

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), this.gl.STATIC_DRAW);

        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);


        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    },

    init: function () {
        this.video = document.getElementById('myVideo');

        const videoPlayer = new VideoPlayer({videoElement: this.video});
        videoPlayer.init();

        this.glcanvas = document.getElementById('myCanvas');

        this.gl = ((this.glcanvas.getContext("webgl")) || (this.glcanvas.getContext("experimental-webgl")));
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        if (this.gl && this.gl instanceof WebGLRenderingContext) {
            console.log("WebGL is available");
        } else {
            console.log("WebGL is NOT available");
        }

        this.initShader();

        this.videoHandler = new VideoHandler({
            gl: this.gl,
            video: this.video,
            program: this.program,
            positionsBuffer: this.positionsBuffer,
            attributes: this.attributes,
            uniforms: this.uniforms,
            verticesIndexBuffer: this.verticesIndexBuffer,
            texture: this.texture,
        });

        this.videoHandler.init({videoTimerCallback: this.videoTimerCallback(this)});

        this.preloadImages();
    },

    videoTimerCallback: function (self) {
        return function () {
            self.resize(self.gl);

            self.videoHandler.displayFrame();

            self.alignImagesBetweenRedraws(self);
        }
    },

    alignImagesBetweenRedraws: function (self) {
        let entitiesToDraw = self.getImagesDataForCurrentFrame();

        Object.keys(self.drawnImages).forEach(existingImageEntityName => {
            if (entitiesToDraw.filter(e => e.entityName === existingImageEntityName).length < 1) {
                self.drawnImages[existingImageEntityName] = undefined;
            }
        });

        entitiesToDraw.forEach(imageData => self.firstImageRender(imageData));
    },

    preloadImages: function () {
        this.images = imageService.getAllImages({width: 20, height: 20});
    },

    firstImageRender: function (imageData) {
        const gl = this.gl;

        if (!this.drawnImages[imageData.entityName]) {

            const fragmentShader = this.getShaderByName('shader-fs-img');
            const vertexShader = this.getShaderByName('shader-vs-img');

            const imgProgram = this.gl.createProgram();

            this.gl.attachShader(imgProgram, vertexShader);
            this.gl.attachShader(imgProgram, fragmentShader);

            this.gl.linkProgram(imgProgram);

            if (!this.gl.getProgramParameter(imgProgram, this.gl.LINK_STATUS)) {
                alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(imgProgram));
            }

            // Add opacity
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.gl.useProgram(imgProgram);

            // look up where the vertex data needs to go.
            var positionLocation = gl.getAttribLocation(imgProgram, "a_position");

            // look up uniform locations
            var u_imageLoc = gl.getUniformLocation(imgProgram, "u_image");
            var u_matrixLoc = gl.getUniformLocation(imgProgram, "u_matrix");

            // provide texture coordinates for the rectangle.
            this.imgPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.imgPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);

            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            const imgTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, imgTexture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData.img);

            var pixels = new Uint8Array(4 * gl.drawingBufferWidth * gl.drawingBufferHeight);

            var dstX = imageData.x;
            var dstY = imageData.y;
            var dstWidth = imageData.dirtyWidth;
            var dstHeight = imageData.dirtyHeight;

            // convert dst pixel coords to clipspace coords
            var clipX = dstX / gl.canvas.width * 2 - 1;
            var clipY = dstY / gl.canvas.height * -2 + 1;
            var clipWidth = dstWidth / gl.canvas.width * 2;
            var clipHeight = dstHeight / gl.canvas.height * -2;

            // build a matrix that will stretch our
            // unit quad to our desired size and location
            gl.uniformMatrix3fv(u_matrixLoc, false, [clipWidth, 0, 0, 0, clipHeight, 0, clipX, clipY, 1,]);

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


            this.drawnImages[imageData.entityName] = {
                program: imgProgram,
                texture: imgTexture,
            };
        }

        this.gl.useProgram(this.drawnImages[imageData.entityName].program);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // gl.clearColor(0, 0, 0, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);

        var dstX = imageData.x;
        var dstY = imageData.y;
        var dstWidth = imageData.dirtyWidth;
        var dstHeight = imageData.dirtyHeight;

        // convert dst pixel coords to clipspace coords
        var clipX = dstX / gl.canvas.width * 2 - 1;
        var clipY = dstY / gl.canvas.height * -2 + 1;
        var clipWidth = dstWidth / gl.canvas.width * 2;
        var clipHeight = dstHeight / gl.canvas.height * -2;

        var u_matrixLoc = gl.getUniformLocation(this.drawnImages[imageData.entityName].program, "u_matrix");

        gl.uniformMatrix3fv(u_matrixLoc, false, [clipWidth, 0, 0, 0, clipHeight, 0, clipX, clipY, 1,]);

        var positionLocation = gl.getAttribLocation(this.drawnImages[imageData.entityName].program, "a_position");

        // look up uniform locations
        var u_imageLoc = gl.getUniformLocation(this.drawnImages[imageData.entityName].program, "u_image");
        var u_matrixLoc = gl.getUniformLocation(this.drawnImages[imageData.entityName].program, "u_matrix");

        gl.bindBuffer(gl.ARRAY_BUFFER, this.imgPositionBuffer);

        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(positionLocation);

        gl.bindTexture(gl.TEXTURE_2D, this.drawnImages[imageData.entityName].texture);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    },

    render: function (imageData) {
        const gl = this.gl;
        const program = this.imgProgram;

        if (!this.drawnImages[imageData.entityName]) {
            console.log('New image: ', imageData.entityName);
            this.firstImageRender(imageData);
            return;
        }

        console.log('Not new image: ', imageData.entityName);

        this.drawnImages[imageData.entityName] = imageData.entityName;


    }
    ,

    getImagesDataForCurrentFrame: function () {
        let entitiesToReplace = DetectorService.getPositionsForFrame({timeOffsetSec: this.video.currentTime});

        if (entitiesToReplace === undefined || entitiesToReplace === null || entitiesToReplace.length === 0) {
            return [];
        }

        const result = [];

        entitiesToReplace.forEach(entity => {
            const frameWidth = this.gl.drawingBufferWidth;
            const frameHeight = this.gl.drawingBufferHeight;

            const x = (entity.positions.left || 0) * frameWidth;
            const y = (entity.positions.top || 0) * frameHeight;

            const x1 = (entity.positions.right || 0) * frameWidth;
            const y1 = (entity.positions.bottom || 0) * frameHeight;

            const dirtyWidth = x1 - x;
            const dirtyHeight = y1 - y;

            const img = imageService.initiatedImages[entity.entityName];

            result.push({
                img, dirtyWidth, dirtyHeight, x, y, x1, y1, entityName: entity.entityName
            });
        });

        return result;
    }
    ,

    resize: function (gl) {
        var realToCSSPixels = window.devicePixelRatio;

        var displayWidth = Math.floor(gl.canvas.clientWidth * realToCSSPixels);
        var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

        if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
            gl.canvas.width = displayWidth;
            gl.canvas.height = displayHeight;
        }

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

}

