class EventsController < ApplicationController
  before_action only: [:new] do
    is_authenticated?(request.path)
  end

  def get_time_in_time_zone(time_to_convert, time_zone_offset, additional_offset=0)
    ActiveSupport::TimeZone[ time_zone_offset ].parse(time_to_convert.strftime("%Y-%m-%d %I:%M%p"))
  end

  def index
    @events = kpget("/events")
    @view = 'index'
    @page = request.path == '/' ? :home : :events
  end

  def new
    @event = {}
    @tier = {}
  end

  def edit
    @event = kpget("/events/" + params[:id])


    p "EDIT:@event -----------------"
    pp @event
    p "-----------------"

    @tier = @event["tiers"][0]
    @startDate = (@event["start"].present?) ? Date.parse(@event["start"]).strftime("%Y-%m-%d") : nil
    @startTime = (@event["start"].present?) ? Time.parse(@event["start"]).strftime("%H:%M") : nil
    @endDate = (@event["end"].present?) ? Date.parse(@event["end"]).strftime("%Y-%m-%d") : nil
    @endTime = (@event["end"].present?) ? Time.parse(@event["end"]).strftime("%H:%M") : nil
    @deadline = (@event["deadline"].present?) ? Date.parse(@event["deadline"]).strftime("%Y-%m-%d") : nil

    if (@event["locationName"].present? && @event["locationAddress"].present? && @event["locationCity"].present? && @event["locationState"].present?)
      @location = "#{@event["locationName"]}, #{@event["locationAddress"]}, #{@event["locationCity"]}, #{@event["locationState"]}"
    end
  end

  def create
    apiEndpoint = (params[:slug].present?) ? "/events/#{params["slug"]}/update" : "/events"

    startDateTime = DateTime.parse("#{params['startDate']} #{params['startTime']}")
    endDateTime = nil

    if params['endDate'].present? && params['endTime'].present?
      endDateTime = DateTime.parse("#{params['endDate']} #{params['endTime']}")
    elsif params['endDate'].present?
      endDateTime = DateTime.parse("#{params['endDate']}")
    end

    image = params[:headerImg]
    if image
      image = {
        data: Base64.encode64(image.read),
        name: image.original_filename,
        type: image.content_type
      }
    end

    formatted_params = {
      event: {
        contactEmail: params['contactEmail'],
        contactPhone: params['contactPhone'],
        deadline: DateTime.parse(params['deadline']),
        description: params['description'],
        eventTypeId: params['eventTypeId'],
        headerImg: image,
        locationAddress: params['locationAddress'],
        locationLat: params['locationLat'].to_f,
        locationLng: params['locationLng'].to_f,
        locationName: params['locationName'],
        locationCity: params['locationCity'],
        locationState: params['locationState'],
        locationCountry: params['locationCountry'],
        name: params['name'],
        status: params['status'].to_i,
        start: startDateTime,
        end: endDateTime
      },
      tiers: [
        {
          minAttendeeCount: params['attendeeCount'].to_i,
          maxAttendeeCount: params['maxAttendeeCount'].to_i,
          contribution: params['contribution'].to_f,
          contributionNote: params['contributionNote']
        }
      ]
    }

    p '-----------------------'
    pp formatted_params
    p '-----------------------'

    response = HTTParty.post(
      Rails.application.config.api_url + apiEndpoint,
      :body => formatted_params.to_json,
      :headers => {
        "Authorization" => "Bearer #{cookies[:auth_token]}",
        "Accept": "application/json",
        "Content-Type" => "application/json"
      }
    ).parsed_response

    p '-----------------------'
    pp response
    p '-----------------------'
    redirect_to "/events/#{response['data']['slug']}"
  end

  def show
    @event = kpget("/events/" + params[:id])
    @tier = @event["tiers"][0]

    temp_progress = @event['committedCount'] / @tier['minAttendeeCount']
    @progress = (temp_progress > 1 ? 1 : temp_progress) * 100

    p "EDIT:@event -----------------"
    pp @event
    p "-----------------"

    @id = @event['slug']
    @view = 'event-details'
    @page = :event
    @page_title = @event['name']
  end

end
