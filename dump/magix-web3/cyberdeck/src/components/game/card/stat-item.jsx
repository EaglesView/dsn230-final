import { AtkIcon, HealthIcon } from "../../ui/icons";

const StatItem = ({
  path,
  iconSrc = "/",
  value = 99,
  typeOf = "health",
  transition_duration = 300,
  position = "hand",
}) => {
  return (
    <div
      className={`cut-br w-full h-full  ${position == "hand" ? "text-2xl bg-primary/60" : "text-4xl bg-primary/80"} font-serif font-bold`}
    >
      <div
        className={`w-full h-full transition-all duration-50 cubic flex items-center justify-start ${position == "hand" && "group-hover:justify-between"}  pr-4`}
      >
        {typeOf == "health" ? (
          <HealthIcon
            size={position == "hand" ? "24px" : "36px"}
            className={`transition-all duration-${transition_duration} fill-background group-hover:fill-secondary`}
          />
        ) : (
          <AtkIcon
            size={position == "hand" ? "24px" : "36px"}
            className={`transition-all duration-${transition_duration} fill-background group-hover:fill-secondary`}
          />
        )}

        {value}
      </div>
    </div>
  );
};
export default StatItem;
