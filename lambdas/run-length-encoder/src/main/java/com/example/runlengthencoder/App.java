package com.example.runlengthencoder;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import java.util.Map;

public class App implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {

	@Override
	public APIGatewayV2HTTPResponse handleRequest(final APIGatewayV2HTTPEvent event, final Context context) {
		final String request = event.getBody();

		context.getLogger().log("Received request to encode [%s]\n".formatted(request));

		final String result = encode(request);
		APIGatewayV2HTTPResponse response = new APIGatewayV2HTTPResponse();
		response.setStatusCode(200);
		response.setHeaders(Map.of("Content-Type", "text/plain"));
		response.setBody(result);
		return response;
	}

	private String encode(String input) {
		if (input == null || input.length() == 0) return "";

		final StringBuilder result = new StringBuilder();
		char current = input.charAt(0);
		int count = 1;
		for (int i = 1, iMax = input.length() - 1; i <= iMax; i++) {
			char next = input.charAt(i);
			if (next == current) count++;
			else {
				result.append(current);
				if (count > 1) result.append(count);
				count = 1;
				current = next;
			}
		}
		result.append(current);
		if (count > 1) result.append(count);
		return result.toString();
	}
}