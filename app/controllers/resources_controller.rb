class ResourcesController < ApplicationController
  # skip_before_filter  :verify_authenticity_token
  protect_from_forgery with: :null_session, only: [:create]

  wrap_parameters format: [:json]

  def index
    # p '--------------'
    # p params
    @event = kpget("/events/" + params[:event_id])
    @tier = @event['tiers'][0]
    @id = @event['slug']
    @tierId = @tier['tierId']
    @minAttendeeCount = @tier['minAttendeeCount']

    @resourceTypes = @tier["resourceTypes"]

    @resource_types = [
      {
        "id":2,
        "name":"Photographer"
      },
      {
        "id":3,
        "name":"Bartender"
      },
      {
        "id":4,
        "name":"Band"
      },
      {
        "id":5,
        "name":"Catering"
      },
      {
        "id":6,
        "name":"Venue"
      },
      {
        "id":7,
        "name":"Limo/Bus"
      },
      {
        "id":8,
        "name":"Boat"
      },
      {
        "id":9,
        "name":"Other"
      }
    ]

    for type in @resourceTypes
      for type2 in @resource_types
        if type["id"] == type2[:id]
          type2[:resource] = type["resources"]
          break
        end
      end
    end

    p ''
    p ''
    p 'TIER'
    p '----------------'
    pp @tier
    p '----------------'
    p ''
    p ''
    p ''
  end

  def create
    response = kppost("/events/#{params[:id]}/update", params, request.headers['Authorization'])
  end
end
