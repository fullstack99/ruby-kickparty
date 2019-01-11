Rails.application.routes.draw do

  get 'resources/index'

  get '/signin', to: 'auth#signin'
  post '/signin', to: 'auth#signin_submit'
  post '/signin_facebook', to: 'auth#signin_facebook'
  get '/signup', to: 'auth#signup'
  post '/signup', to: 'auth#signup_submit'
  get '/signout', to: 'auth#signout'

  resources :events do
    resources :attend
    resources :resources
    resources :comments
  end

  get '/about-kickparty', to: 'pages#about'
  get '/contact-kickparty', to: 'pages#contact'

  resources :events
  resources :payment
  resources :users

  get '/:id/edit', to: 'users#edit'
  post '/:id/edit', to: 'users#update'
  get '/:id', to: 'users#show'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  # Serve websocket cable requests in-process
  # mount ActionCable.server => '/cable'

  root 'home#index'
end
