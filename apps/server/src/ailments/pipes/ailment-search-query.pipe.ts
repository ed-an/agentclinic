import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const AILMENT_SEARCH_MAX_LENGTH = 100;

@Injectable()
export class AilmentSearchQueryPipe implements PipeTransform<
  unknown,
  string | undefined
> {
  transform(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') {
      throw new BadRequestException('Search query must be a single string');
    }

    const query = value.trim();
    if (query.length === 0) return undefined;
    if ([...query].length > AILMENT_SEARCH_MAX_LENGTH) {
      throw new BadRequestException(
        `Search query must be ${AILMENT_SEARCH_MAX_LENGTH} characters or fewer`,
      );
    }

    return query;
  }
}
