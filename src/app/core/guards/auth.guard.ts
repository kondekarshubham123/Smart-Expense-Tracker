import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth";
import { map, take } from "rxjs/operators";

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    
    return authService.user$.pipe(
        take(1),
        map(user => {
            if (user) {
                return true;
            }
            router.navigate(["/login"]);
            return false;
        })
    );
}