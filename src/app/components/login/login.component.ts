import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../services/login-service/auth.service';
import { Router } from '@angular/router';
import { LoginUserDto, RegisterUserDto, TokenResponseDto } from '../../interfaces/auth';
import Swal from 'sweetalert2';
import { catchError, map, Observable, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {

  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  isLoginView: boolean = true;
  loading: boolean = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  registerUser: RegisterUserDto = {
    name: '',
    email: '',
    password: '',
  };

  loginUser: LoginUserDto = {
    email: '',
    password: ''
  };


  loginForm: FormGroup = new FormGroup({
    passwordLogin: new FormControl('', [Validators.required, Validators.pattern(this.PASSWORD_PATTERN)]),
    emailLogin: new FormControl('', [Validators.required, Validators.email])
  });


  registerForm = new FormGroup({user: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
    password: new FormControl('', [Validators.required, Validators.pattern(this.PASSWORD_PATTERN)]),
    repeatPassword: new FormControl('', [Validators.required, Validators.pattern(this.PASSWORD_PATTERN)]),
    email: new FormControl('', [Validators.required, Validators.email], [this.emailAvailable()])
  }, { validators: this.passwordsMatchValidator() });

  private passwordsMatchValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get('password');
      const repeatPassword = formGroup.get('repeatPassword');

      if (!password || !repeatPassword || !password.value || !repeatPassword.value) {
        return null;
      }

      if (password.value !== repeatPassword.value) {
        repeatPassword.setErrors({ passwordsMatch: true });
        return { passwordsMatch: true };
      }

      const currentErrors = repeatPassword.errors;
      if (currentErrors) {
        delete currentErrors['passwordsMatch'];
        repeatPassword.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }

      return null;
    };
  }



  onSubmitLogin(): void {
    if (this.loginForm.valid ) {
      this.loading = true;
      this.error = null;
  
      this.loginUser = {
        email:  this.loginForm.get('emailLogin')?.value,
        password: this.loginForm.get('passwordLogin')?.value,
      };
  
      const loginSubscription = this.authService.login(this.loginUser).subscribe({
        next: (response: TokenResponseDto) => {
          Swal.fire({
            icon: 'success',
            title: '¡Inicio de sesión exitoso!',
            text: 'Bienvenido de vuelta',
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              title: 'custom-swal-title',
              popup: 'custom-swal-content',
              confirmButton: 'custom-swal-confirm-button'
            }
          }).then(() => {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
            this.loginForm.reset();
          });
        },
        error: (error) => {
          this.authService.logout();
          let errorMessage = 'Error desconocido';
          if (error.status === 401) {
            errorMessage = error.error?.message || 'Credenciales inválidas';
          }
          Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: errorMessage || 'Error desconocido',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#33A3AA',
            customClass: {
              title: 'custom-swal-title',
              popup: 'custom-swal-content',
              confirmButton: 'custom-swal-confirm-button'
            }
          });          
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  
      this.subscriptions.push(loginSubscription);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos requeridos correctamente',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#33A3AA',
        customClass: {
          title: 'custom-swal-title',
          popup: 'custom-swal-content',
          confirmButton: 'custom-swal-confirm-button'
        }
      });
      
      this.loginForm.markAllAsTouched();
    }
  }

  onSubmitRegister(): void {
    

    if (this.registerForm.valid) {
      this.loading = true;
      this.error = null;

      this.registerUser = {
        name: this.registerForm.get('user')?.value ?? '',
        password: this.registerForm.get('password')?.value ?? '',
        email: this.registerForm.get('email')?.value ?? ''
      };

      const registerSubscription = this.authService.register(this.registerUser).subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Bienvenido a nuestra plataforma',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
            this.registerForm.reset();
          });
        },
        error: (error) => {
          this.loading = false;
          this.authService.logout();
          const errorMessage = error.status === 500 ? 'Error en el servidor' : 'Error desconocido';
          
          Swal.fire({
            icon: 'error',
            title: 'Intente más tarde',
            text: errorMessage,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#33A3AA'
          });
        }
      });

      this.subscriptions.push(registerSubscription);
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });

      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos requeridos correctamente',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#33A3AA'
      });
    }
  }
  emailAvailable(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
  
      return this.authService.getUsers().pipe(
        map(users => {
          if (!users || users.length === 0) {
            return null;
          }
          const exists = users.some(u => u.email?.toLowerCase() === control.value?.toLowerCase());
          return exists ? { emailExist: true } : null;
        }),
        catchError(() => {
          return of(null);
        })
      );
    };
  }
    
  showPasswordLogin: boolean = false;
  showPasswordRegister: boolean = false;
  showRepeatPasswordRegister: boolean = false;

  togglePasswordVisibilityRegister() {
    this.showPasswordRegister = !this.showPasswordRegister;
  }

  togglePasswordRepeatVisibilityRegister() {
    this.showRepeatPasswordRegister = !this.showRepeatPasswordRegister;
  }

  togglePasswordVisibilityLogin() {
    this.showPasswordLogin = !this.showPasswordLogin;
  }

  toggleView(): void {
    this.isLoginView = !this.isLoginView;
    this.loginForm.reset();
    this.registerForm.reset();
  }
 

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
