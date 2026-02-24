import { Pipe, PipeTransform } from '@angular/core';
import { Car } from '../interfaces/gallery-image.interface';

@Pipe({
  name: 'carById',
  standalone: false,
  pure: false
})
export class CarByIdPipe implements PipeTransform {
  transform(carId: number, carsMap: Map<number, Car>): Car | undefined {
    return carsMap.get(carId);
  }
}
