import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SaleAnalysisResult {
  title?: string;
  description?: string;
  discountPercentage?: number;
  originalPrice?: number;
  salePrice?: number;
  category?: string;
  products?: string[];
  storeName?: string;
  confidence: number;
  rawText?: string;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private aiProvider: 'gemini' | 'openai';

  constructor(private configService: ConfigService) {
    this.aiProvider = this.configService.get('AI_PROVIDER', 'gemini') as 'gemini' | 'openai';
  }

  async analyzeImage(imageUrl: string): Promise<SaleAnalysisResult> {
    const provider = this.aiProvider;

    try {
      if (provider === 'gemini') {
        return await this.analyzeWithGemini(imageUrl);
      } else {
        return await this.analyzeWithOpenAI(imageUrl);
      }
    } catch (error) {
      this.logger.error(`Image analysis failed with ${provider}:`, error);
      return {
        confidence: 0,
        rawText: `Analysis failed: ${error.message}`,
      };
    }
  }

  private async analyzeWithGemini(imageUrl: string): Promise<SaleAnalysisResult> {
    const apiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_GEMINI_API_KEY not configured');
      return { confidence: 0, rawText: 'Gemini API key not configured' };
    }

    try {
      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this sale/discount image and extract the following information in JSON format:
{
  "title": "short title for the sale",
  "description": "brief description",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "one of: clothing, shoes, electronics, home_goods, beauty, sports, food, other",
  "products": ["list", "of", "products"],
  "storeName": "store name if visible",
  "confidence": 0.0 to 1.0
}
Only respond with valid JSON, no other text.`,
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            rawText: text,
          };
        }
      }

      return { confidence: 0, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('Gemini analysis error:', error);
      throw error;
    }
  }

  private async analyzeWithOpenAI(imageUrl: string): Promise<SaleAnalysisResult> {
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured');
      return { confidence: 0, rawText: 'OpenAI API key not configured' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this sale/discount image and extract information in JSON format:
{
  "title": "short title",
  "description": "brief description",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "clothing|shoes|electronics|home_goods|beauty|sports|food|other",
  "products": ["list"],
  "storeName": "if visible",
  "confidence": 0.0 to 1.0
}
Only respond with valid JSON.`,
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        const text = data.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...parsed, rawText: text };
        }
      }

      return { confidence: 0, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured for embeddings');
      return new Array(1536).fill(0);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      const data = await response.json();
      return data.data?.[0]?.embedding || new Array(1536).fill(0);
    } catch (error) {
      this.logger.error('Embedding generation error:', error);
      return new Array(1536).fill(0);
    }
  }

  async getRecommendations(userId: string, userPreferences: unknown) {
    // TODO: Implement pgvector similarity search
    return {
      message: 'Recommendations feature coming soon',
      userId,
      preferences: userPreferences,
    };
  }
}
