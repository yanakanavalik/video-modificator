import {imageService} from '../services/image_service';
import {detectorService} from '../services/detector_service';
import {shaderService} from '../services/shader_service';

export class AssetsHandler {
    constructor({gl}) {
        // Current gl
        this.gl = gl;

        // Already drawn images on canvas
        this.drawnImages = {};
    }

    // Draw assets for current time offset
    drawAssets({timeOffset}) {
        let entitiesToDraw = this._getEntitiesToDraw({timeOffset});

        entitiesToDraw.forEach(imageData => this._renderImage(imageData));
    }

    preloadImages() {
        // For optimization load all images which can be used across the video
        imageService.loadAllImages({width: 20, height: 20});
    }

    _getEntitiesToDraw({timeOffset}) {
        let imagesDataForCurrentFrame = this._getImagesDataForCurrentFrame(timeOffset);

        // Remove drawn assets, which shouldn't be drawn for the current time offset
        Object.keys(this.drawnImages).forEach(existingImageEntityName => {
            if (imagesDataForCurrentFrame.filter(e => e.entityName === existingImageEntityName).length < 1) {
                this.drawnImages[existingImageEntityName] = undefined;
            }
        });

        return imagesDataForCurrentFrame;
    }

    // Draw image first time
    _drawNewImage({imageData}) {
        const fragmentShader = shaderService.getShaderById('shader-fs-img', this.gl);
        const vertexShader = shaderService.getShaderById('shader-vs-img', this.gl);

        const imgProgram = this.gl.createProgram();

        this.gl.attachShader(imgProgram, vertexShader);
        this.gl.attachShader(imgProgram, fragmentShader);

        this.gl.linkProgram(imgProgram);

        if (!this.gl.getProgramParameter(imgProgram, this.gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(imgProgram));
        }

        // Add opacity
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.useProgram(imgProgram);

        // Provide texture coordinates for the rectangle.
        this.imgPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.imgPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), this.gl.STATIC_DRAW);

        this._enableVertexAttribArray({imageProgram: imgProgram});

        const imgTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, imgTexture);

        // Set the parameters so that any size image can be rendered
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        // Upload the image into the texture.
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageData.img);

        // Prepare matrix
        this._prepareImageMatrix({imageData, matrixLocation: this.gl.getUniformLocation(imgProgram, "u_matrix")});

        // Draw
        this._drawRectangle();

        // Store drawn image
        this.drawnImages[imageData.entityName] = {
            program: imgProgram,
            texture: imgTexture,
        };
    }

    // Redraw already existing image
    _redrawExistingImage({imageData}) {
        // Use program for current drawn image
        this.gl.useProgram(this.drawnImages[imageData.entityName].program);

        // Prepare matrix
        this._prepareImageMatrix({
            imageData,
            matrixLocation: this.gl.getUniformLocation(this.drawnImages[imageData.entityName].program, "u_matrix")
        });

        // Bind position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.imgPositionBuffer);

        this._enableVertexAttribArray({imageProgram: this.drawnImages[imageData.entityName].program});

        // Bind image texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.drawnImages[imageData.entityName].texture);

        // Draw
        this._drawRectangle();
    }

    // Look up where the vertex data needs to go
    _enableVertexAttribArray({imageProgram}) {
        const positionLocation = this.gl.getAttribLocation(imageProgram, "a_position");

        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.enableVertexAttribArray(positionLocation);
    }

    _drawRectangle() {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    }

    _prepareImageMatrix({imageData, matrixLocation}) {
        const dstX = imageData.x;
        const dstY = imageData.y;
        const dstWidth = imageData.dirtyWidth;
        const dstHeight = imageData.dirtyHeight;

        // convert dst pixel coords to clipspace coords
        const clipX = dstX / this.gl.canvas.width * 2 - 1;
        const clipY = dstY / this.gl.canvas.height * -2 + 1;
        const clipWidth = dstWidth / this.gl.canvas.width * 2;
        const clipHeight = dstHeight / this.gl.canvas.height * -2;

        this.gl.uniformMatrix3fv(matrixLocation, false, [clipWidth, 0, 0, 0, clipHeight, 0, clipX, clipY, 1,]);
    }

    _renderImage(imageData) {
        if (!this.drawnImages[imageData.entityName]) {
            this._drawNewImage({imageData});
        } else {
            this._redrawExistingImage({imageData})
        }
    }

    _getImagesDataForCurrentFrame(timeOffset) {
        let entitiesToReplace = detectorService.getPositionsForTimeOffset({timeOffsetSec: timeOffset});

        if (entitiesToReplace.length === 0) {
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

            const img = imageService.loadedImages[entity.entityName];

            result.push({
                img, dirtyWidth, dirtyHeight, x, y, x1, y1, entityName: entity.entityName
            });
        });

        return result;
    }
}