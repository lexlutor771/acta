import { Pipe, PipeTransform } from '@angular/core';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

@Pipe({
    name: 'dateFormat',
    standalone: true
})
export class DateFormatPipe implements PipeTransform {
    transform(value: any, pattern: string = 'dd/MM/yyyy HH:mm'): string {
        if (!value) return '-';

        const date = new Date(value);
        if (!isValid(date)) return '-';

        return format(date, pattern, { locale: es });
    }
}
