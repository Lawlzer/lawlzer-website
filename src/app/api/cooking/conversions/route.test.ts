import { NextRequest } from 'next/server';
import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

describe('/api/cooking/conversions', () => {
  describe('GET', () => {
    it('should convert between weight units', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=100&from=g&to=oz&type=weight'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('result');
      expect(data.result).toBeCloseTo(3.527, 2);
    });

    it('should convert between volume units', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=1&from=cup&to=ml&type=volume'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('result');
      expect(data.result).toBeCloseTo(236.588, 2);
    });

    it('should convert between temperature units', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=100&from=C&to=F&type=temperature'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('result');
      expect(data.result).toBe(212);
    });

    it('should handle invalid conversion type', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=100&from=g&to=cup&type=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle missing parameters', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=100'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required parameters');
    });

    it('should handle invalid amount', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=abc&from=g&to=oz&type=weight'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid amount');
    });

    it('should handle incompatible unit conversion', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=100&from=g&to=ml&type=weight'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Cannot convert between weight and volume');
    });

    it('should handle zero amount', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=0&from=g&to=oz&type=weight'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result).toBe(0);
    });

    it('should handle negative amounts for non-temperature conversions', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=-100&from=g&to=oz&type=weight'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Amount must be positive');
    });

    it('should allow negative amounts for temperature conversions', async () => {
      const request = new NextRequest(
        'http://localhost/api/cooking/conversions?amount=-40&from=C&to=F&type=temperature'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result).toBe(-40); // -40°C = -40°F
    });
  });
});
