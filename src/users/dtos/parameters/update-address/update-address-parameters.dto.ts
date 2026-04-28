// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsDefined, IsOptional } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * update a user's address.
 */
export class UpdateAddressParametersDto {
    /**
     * Primary address line (street, number, etc.).
     */
    @IsDefined({ message: 'Address line is required.' })
    addressLine: string;

    /**
     * Optional secondary address line (apartment, suite, etc.).
     */
    @IsOptional()
    addressLine2?: string;

    /**
     * City name.
     */
    @IsDefined({ message: 'City is required.' })
    city: string;

    /**
     * ISO country code (e.g., US, MX).
     */
    @IsDefined({ message: 'Country code is required.' })
    countryCode: string;

    /**
     * Country name.
     */
    @IsDefined({ message: 'Country name is required.' })
    countryName: string;

    /**
     * Postal or ZIP code.
     */
    @IsOptional()
    postalCode?: string;

    /**
     * Province/state code.
     */
    @IsDefined({ message: 'Providence code is required.' })
    provinceCode: string;

    /**
     * Province/state name.
     */
    @IsDefined({ message: 'Providence name is required.' })
    provinceName: string;
}
