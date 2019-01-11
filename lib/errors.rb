class APIError < StandardError
    attr_accessor :code
    def initialize(code, msg)
        super(msg)    
        @code = code
    end
end

class APINotFoundError < APIError 

end

class API40XError < APIError 

end

class API50XError < APIError 

end
