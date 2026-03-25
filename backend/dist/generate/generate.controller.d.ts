import { GenerateService } from './generate.service';
import type { User } from '@prisma/client';
declare class GenerateCommentsDto {
    postText: string;
    platform: string;
    tones: string[];
}
export declare class GenerateController {
    private readonly generateService;
    constructor(generateService: GenerateService);
    generate(user: User, dto: GenerateCommentsDto): Promise<{
        suggestions: import("../openai/openai.service").CommentSuggestion[];
    }>;
}
export {};
