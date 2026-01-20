import { mat4 } from '../utils/math.js';
export class Raycaster {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
    }

    getNormalizedDeviceCoords(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((mouseX - rect.left) / rect.width) * 2 - 1;
        const y = -((mouseY - rect.top) / rect.height) * 2 + 1;
        return { x, y };
    }

    createRay(mouseX, mouseY, cameraPosition, projectionMatrix, viewMatrix) {
        const ndc = this.getNormalizedDeviceCoords(mouseX, mouseY);
        
        // Inverter a matriz de projeção
        const invProjection = mat4.create();
        mat4.invert(invProjection, projectionMatrix);
        
        // Inverter a matriz de view
        const invView = mat4.create();
        mat4.invert(invView, viewMatrix);
        
        // Ponto no clip space (near plane)
        const clipNear = [ndc.x, ndc.y, -1, 1];
        const clipFar = [ndc.x, ndc.y, 1, 1];
        
        // Transformar para view space
        const viewNear = this.transformPoint(clipNear, invProjection);
        const viewFar = this.transformPoint(clipFar, invProjection);
        
        // Transformar para world space
        const worldNear = this.transformPoint(viewNear, invView);
        const worldFar = this.transformPoint(viewFar, invView);
        
        // Origem do raio é a posição da câmera
        const origin = [cameraPosition.x, cameraPosition.y, cameraPosition.z];
        
        // Direção do raio
        const direction = [
            worldFar[0] - worldNear[0],
            worldFar[1] - worldNear[1],
            worldFar[2] - worldNear[2]
        ];
        
        // Normalizar direção
        const len = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
        direction[0] /= len;
        direction[1] /= len;
        direction[2] /= len;
        
        return { origin, direction };
    }

    transformPoint(point, matrix) {
        const x = point[0], y = point[1], z = point[2], w = point[3];
        const result = [
            matrix[0]*x + matrix[4]*y + matrix[8]*z + matrix[12]*w,
            matrix[1]*x + matrix[5]*y + matrix[9]*z + matrix[13]*w,
            matrix[2]*x + matrix[6]*y + matrix[10]*z + matrix[14]*w,
            matrix[3]*x + matrix[7]*y + matrix[11]*z + matrix[15]*w
        ];
        if (result[3] !== 0) {
            result[0] /= result[3];
            result[1] /= result[3];
            result[2] /= result[3];
        }
        return result;
    }

    intersectSphere(ray, sphereCenter = [0, 0, 0], sphereRadius = 1.0) {
        const oc = [
            ray.origin[0] - sphereCenter[0],
            ray.origin[1] - sphereCenter[1],
            ray.origin[2] - sphereCenter[2]
        ];
        
        const a = ray.direction[0]**2 + ray.direction[1]**2 + ray.direction[2]**2;
        const b = 2 * (oc[0]*ray.direction[0] + oc[1]*ray.direction[1] + oc[2]*ray.direction[2]);
        const c = oc[0]**2 + oc[1]**2 + oc[2]**2 - sphereRadius**2;
        
        const discriminant = b*b - 4*a*c;
        
        if (discriminant < 0) {
            return { hit: false, point: null, distance: -1 };
        }
        
        const sqrtDisc = Math.sqrt(discriminant);
        let t = (-b - sqrtDisc) / (2*a);
        
        if (t < 0) {
            t = (-b + sqrtDisc) / (2*a);
        }
        
        if (t < 0) {
            return { hit: false, point: null, distance: -1 };
        }
        
        const point = [
            ray.origin[0] + ray.direction[0] * t,
            ray.origin[1] + ray.direction[1] * t,
            ray.origin[2] + ray.direction[2] * t
        ];
        
        return { hit: true, point, distance: t };
    }

    normalizeToSphere(point) {
        const len = Math.sqrt(point[0]**2 + point[1]**2 + point[2]**2);
        return [point[0]/len, point[1]/len, point[2]/len];
    }
}